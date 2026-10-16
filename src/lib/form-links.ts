// Borang: a board of form links (Google Forms, Microsoft Forms, Jotform, ...)
// shared by admin and staff, backed by `form_links` (migration 0011).
// Links are never hard-deleted: archiving hides one from the active list, and
// deleting is a soft delete that only admins can see and undo.
import { supabase } from "./supabase/client";
import type { FormLink, User } from "./mock-data";
import type { FormLinkRow } from "./supabase/types";

export const FORM_LINK_TITLE_MAX = 120;
export const FORM_LINK_DESCRIPTION_MAX = 500;
const FORM_LINK_URL_MAX = 2048;

// ---------- link filter ----------
// Only links to pages people open are allowed — not API endpoints, raw IP
// addresses, or links carrying an access key. The database repeats these
// checks (private.form_link_problem in 0011); keep the word lists in step.
const API_HOST_LABELS = [
  "api", "apis", "graphql", "gql", "rest", "rpc",
  "webhook", "webhooks", "hooks", "execute-api",
];
const API_HOST_DOMAINS = [
  "googleapis.com", "supabase.co", "supabase.in", "cloudfunctions.net", "firebaseio.com",
];
const API_PATH_SEGMENTS = [
  "api", "apis", "graphql", "gql", "rest", "rpc",
  "webhook", "webhooks", "hooks", "wp-json",
];
// Versioned / regional names such as "api2", "api-eu", "api_v1".
const API_PREFIXED = /^api[-_\d]/;
const DATA_FILE = /\.(json|xml|ya?ml|graphql)$/;
const SECRET_PARAMS = [
  "key", "apikey", "api_key", "api-key", "access_token", "auth_token",
  "token", "secret", "client_secret", "password", "sig", "signature",
];

export type FormLinkCheck = { ok: true; url: string } | { ok: false; error: string };

const refuse = (error: string): FormLinkCheck => ({ ok: false, error });

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

function isApiHost(host: string): boolean {
  // The last label is the TLD, so "api" there says nothing.
  const labels = host.split(".").slice(0, -1);
  return (
    labels.some((l) => API_HOST_LABELS.includes(l) || API_PREFIXED.test(l)) ||
    API_HOST_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
  );
}

/**
 * Validate a pasted form link. On success returns the normalised https link
 * to store; otherwise a Malay message saying what is wrong with it.
 */
export function checkFormLink(raw: string): FormLinkCheck {
  const value = raw.trim();
  if (!value) return refuse("Sila masukkan pautan borang.");

  // "forms.gle/abc" without a scheme is common when copying from a phone.
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return refuse("Pautan tidak sah. Semak semula pautan yang ditampal.");
  }

  if (url.protocol !== "https:") return refuse("Hanya pautan https:// dibenarkan.");
  if (url.username || url.password) {
    return refuse("Pautan tidak boleh mengandungi nama pengguna atau kata laluan.");
  }

  const host = url.hostname; // already lower-case, IDN as punycode
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.startsWith("[") ||
    /^\d+(\.\d+){3}$/.test(host) ||
    !host.includes(".")
  ) {
    return refuse("Gunakan pautan laman web awam, bukan alamat IP atau localhost.");
  }

  const segments = url.pathname.split("/").map((s) => safeDecode(s).toLowerCase());
  if (
    isApiHost(host) ||
    segments.some((s) => API_PATH_SEGMENTS.includes(s) || API_PREFIXED.test(s))
  ) {
    return refuse(
      "Ini kelihatan seperti pautan API. Hanya pautan borang atau laman web dibenarkan.",
    );
  }
  if (DATA_FILE.test(segments[segments.length - 1] ?? "")) {
    return refuse("Pautan ke fail data (JSON, XML atau YAML) tidak dibenarkan.");
  }
  if ([...url.searchParams.keys()].some((k) => SECRET_PARAMS.includes(k.toLowerCase()))) {
    return refuse(
      "Pautan mengandungi kunci atau token akses. Buang parameter tersebut dan cuba lagi.",
    );
  }
  if (url.href.length > FORM_LINK_URL_MAX) return refuse("Pautan terlalu panjang.");

  return { ok: true, url: url.href };
}

/** Site name shown under a link's title, e.g. "docs.google.com". */
export function formLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Admins manage every link; staff manage the links they posted. */
export function canManageFormLink(link: FormLink, user: User | null): boolean {
  if (!user) return false;
  return user.role === "admin" || link.createdBy === user.id;
}

// ---------- writes ----------
export type FormLinkInput = { title: string; url: string; description: string };

/** Validates the input and returns the row to write, or throws a Malay message. */
function toRow(input: FormLinkInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Sila isi tajuk borang.");
  if (title.length > FORM_LINK_TITLE_MAX) {
    throw new Error(`Tajuk terlalu panjang (maksimum ${FORM_LINK_TITLE_MAX} aksara).`);
  }
  const description = input.description.trim();
  if (description.length > FORM_LINK_DESCRIPTION_MAX) {
    throw new Error(
      `Penerangan terlalu panjang (maksimum ${FORM_LINK_DESCRIPTION_MAX} aksara).`,
    );
  }
  const link = checkFormLink(input.url);
  if (!link.ok) throw new Error(link.error);
  return { title, url: link.url, description: description || null };
}

/**
 * Update a link the caller may change. RLS silently skips rows it may not
 * touch, so an empty result means "not allowed" rather than success.
 */
async function updateOwned(id: string, patch: Partial<FormLinkRow>) {
  const { data, error } = await supabase
    .from("form_links")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error("Pautan tidak dijumpai, atau anda tiada kebenaran untuk mengubahnya.");
  }
}

export async function createFormLink(input: FormLinkInput): Promise<void> {
  // Author, author name and timestamps are stamped by the database.
  const { error } = await supabase.from("form_links").insert(toRow(input));
  if (error) throw new Error(error.message);
}

export async function updateFormLink(id: string, input: FormLinkInput): Promise<void> {
  await updateOwned(id, toRow(input));
}

export async function setFormLinkArchived(id: string, archived: boolean): Promise<void> {
  await updateOwned(id, { archived_at: archived ? new Date().toISOString() : null });
}

/** Soft delete: hidden from staff, kept for admins to restore. */
export async function deleteFormLink(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_form_link", { p_id: id });
  if (error) throw new Error(error.message);
}

/** Admin only: bring a deleted link back to the tab it was deleted from. */
export async function restoreFormLink(id: string): Promise<void> {
  await updateOwned(id, { deleted_at: null, deleted_by: null });
}
