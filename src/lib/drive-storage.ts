// Client for the `drive-files` Edge Function (supabase/functions/drive-files).
// Google credentials never reach the browser: the function holds them and
// checks every request against public.drive_files RLS as the logged-in user.
// See docs/GOOGLE-DRIVE-STORAGE.md for setup.
import { supabase } from "@/lib/supabase/client";

const FUNCTION = "drive-files";

/** Stored reference to a Drive file, e.g. in tracker_records.gambar. */
export const DRIVE_REF_PREFIX = "gdrive:";

export type DriveKind = "content" | "avatar" | "activity";

/** True when uploads should go to Google Drive instead of Supabase Storage. */
export function driveEnabled(): boolean {
  return import.meta.env.VITE_STORAGE_BACKEND === "gdrive";
}

export function isDriveRef(value: string): boolean {
  return value.startsWith(DRIVE_REF_PREFIX);
}

/** Full link to the function for a query string it handed out (?id=…[&exp&sig]). */
export function driveFileUrl(query: string): string {
  const base = (import.meta.env.VITE_SUPABASE_URL as string).replace(
    /\/+$/,
    "",
  );
  return `${base}/functions/v1/${FUNCTION}?${query}`;
}

async function invoke<T>(body: FormData | Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION, { body });
  if (error) {
    // Non-2xx responses carry { error: "..." } on error.context (a Response).
    let message = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const parsed = await ctx.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        /* fall back to error.message */
      }
    }
    throw new Error(message);
  }
  return data as T;
}

/**
 * Upload one file. `scope` is the content folder ("articles" / "videos"), the
 * owner's uid for an avatar, or the parent id for an activity photo.
 * `url` is a permanent link for public kinds and null for activity photos.
 */
export async function uploadToDrive(
  file: File,
  kind: DriveKind,
  scope: string,
): Promise<{ ref: string; url: string | null; name: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  form.append("scope", scope);
  const res = await invoke<{ ref: string; query: string | null; name: string }>(
    form,
  );
  return {
    ref: res.ref,
    url: res.query ? driveFileUrl(res.query) : null,
    name: res.name,
  };
}

/** Signed, short-lived links keyed by ref. Refs the caller may not read are left out. */
export async function signDriveRefs(
  refs: string[],
): Promise<Record<string, string>> {
  if (refs.length === 0) return {};
  const { urls } = await invoke<{ urls: Record<string, string> }>({
    action: "sign",
    refs,
  });
  return Object.fromEntries(
    Object.entries(urls).map(([ref, q]) => [ref, driveFileUrl(q)]),
  );
}

/** Best-effort delete of refs the caller may write. */
export async function removeDriveRefs(refs: string[]): Promise<void> {
  if (refs.length === 0) return;
  await invoke({ action: "delete", refs });
}
