// Google Drive storage for uploads (see docs/GOOGLE-DRIVE-STORAGE.md).
//
// The SPA is static, so all Drive API calls run here. Files live in ONE
// app-owned Google account, reached with an OAuth refresh token that only this
// function knows. Access control lives in public.drive_files (migration 0015):
// each check below runs a query under the CALLER's JWT, so RLS decides.
//
//   POST multipart  file, kind, scope                  -> { ref, query, name }
//   POST json       action=sign    refs[]              -> { urls: {ref: query} }
//   POST json       action=delete  refs[]              -> { deleted: ref[] }
//   GET  ?id=<drive id>[&exp=&sig=]                    -> the file bytes
//
// GET is open (an <img> tag can't send a JWT): content and avatar files are
// public anyway, and activity photos need a short-lived HMAC signature that
// only `sign` hands out, after RLS has allowed the caller to see the photo.
//
// Deploy:  supabase functions deploy drive-files --no-verify-jwt

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers":
    "content-length, content-range, accept-ranges",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const env = (name: string) => {
  const v = Deno.env.get(name);
  if (!v)
    throw new HttpError(
      500,
      `Storan Google Drive belum dikonfigurasi (${name}).`,
    );
  return v;
};

// ---------- rules (kept in step with src/lib/storage.ts) ----------
type Kind = "content" | "avatar" | "activity";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const RULES: Record<Kind, { types: string[]; maxBytes: number }> = {
  content: {
    types: ["application/pdf", ...IMAGE_TYPES],
    maxBytes: 20 * 1024 * 1024,
  },
  avatar: { types: IMAGE_TYPES, maxBytes: 5 * 1024 * 1024 },
  activity: { types: IMAGE_TYPES, maxBytes: 5 * 1024 * 1024 },
};
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** The real type from the file's first bytes; the browser's claim isn't trusted. */
function sniffType(b: Uint8Array): string | null {
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 5) === "%PDF-") return "application/pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

const SIGNED_URL_TTL = 60 * 60; // seconds, same as Storage signed links
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REF_PREFIX = "gdrive:";

// ---------- supabase ----------
function serviceClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** A client that runs as the caller, so RLS on drive_files applies. */
async function callerClient(
  req: Request,
): Promise<{ db: SupabaseClient; userId: string }> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token)
    throw new HttpError(401, "Sesi tidak sah. Sila log masuk semula.");
  const db = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user)
    throw new HttpError(401, "Sesi tidak sah. Sila log masuk semula.");
  return { db, userId: data.user.id };
}

// ---------- google drive ----------
const DRIVE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000)
    return cachedToken.value;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GOOGLE_OAUTH_CLIENT_ID"),
      client_secret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
      refresh_token: env("GOOGLE_OAUTH_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    // invalid_grant = the refresh token was revoked or expired; see the docs.
    console.error("google token refresh failed", res.status, await res.text());
    throw new HttpError(502, "Tidak dapat menyambung ke Google Drive.");
  }
  const body = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
  return body.access_token;
}

async function drive(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await accessToken()}`);
  return fetch(url, { ...init, headers });
}

async function driveJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await drive(url, init);
  if (!res.ok) {
    console.error("drive api error", res.status, await res.text());
    throw new HttpError(502, "Google Drive menolak permintaan.");
  }
  return (await res.json()) as T;
}

const folderCache = new Map<string, string>();

/** Id of a sub-folder of the app's root folder, created on first use. */
async function folderId(name: string): Promise<string> {
  const hit = folderCache.get(name);
  if (hit) return hit;
  const root = env("GOOGLE_DRIVE_ROOT_FOLDER_ID");
  const q = `name = '${name}' and '${root}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const found = await driveJson<{ files: { id: string }[] }>(
    `${DRIVE}/files?${new URLSearchParams({ q, fields: "files(id)", orderBy: "createdTime" })}`,
  );
  let id = found.files[0]?.id;
  if (!id) {
    const made = await driveJson<{ id: string }>(`${DRIVE}/files?fields=id`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [root],
      }),
    });
    id = made.id;
  }
  folderCache.set(name, id);
  return id;
}

/** Resumable upload, so the size limit isn't bound by the multipart body. */
async function driveUpload(
  file: Blob,
  meta: {
    name: string;
    mimeType: string;
    parents: string[];
    appProperties: Record<string, string>;
  },
): Promise<string> {
  const start = await drive(
    `${DRIVE_UPLOAD}/files?uploadType=resumable&fields=id`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": meta.mimeType,
        "X-Upload-Content-Length": String(file.size),
      },
      body: JSON.stringify(meta),
    },
  );
  const session = start.headers.get("Location");
  if (!start.ok || !session) {
    console.error(
      "drive upload start failed",
      start.status,
      await start.text(),
    );
    throw new HttpError(502, "Muat naik ke Google Drive gagal.");
  }
  const put = await fetch(session, {
    method: "PUT",
    headers: { "content-type": meta.mimeType },
    body: file,
  });
  if (!put.ok) {
    console.error("drive upload failed", put.status, await put.text());
    throw new HttpError(502, "Muat naik ke Google Drive gagal.");
  }
  return ((await put.json()) as { id: string }).id;
}

async function driveDelete(id: string): Promise<void> {
  const res = await drive(`${DRIVE}/files/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) {
    console.error("drive delete failed", id, res.status, await res.text());
  }
}

// ---------- signed links ----------
const enc = new TextEncoder();
let hmacKey: Promise<CryptoKey> | null = null;

function signingKey() {
  hmacKey ??= crypto.subtle.importKey(
    "raw",
    enc.encode(env("DRIVE_URL_SIGNING_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return hmacKey;
}

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function sign(id: string, exp: number): Promise<string> {
  return b64url(
    await crypto.subtle.sign(
      "HMAC",
      await signingKey(),
      enc.encode(`${id}.${exp}`),
    ),
  );
}

async function verify(
  id: string,
  exp: string | null,
  sig: string | null,
): Promise<boolean> {
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000)
    return false;
  const expected = await sign(id, Number(exp));
  // Constant-time compare.
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++)
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

// ---------- actions ----------
function publicQuery(driveId: string) {
  return `id=${encodeURIComponent(driveId)}`;
}

async function upload(req: Request) {
  const { db, userId } = await callerClient(req);
  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "") as Kind;
  const scope = String(form.get("scope") ?? "");

  if (!(file instanceof File)) throw new HttpError(400, "Tiada fail dihantar.");
  const rule = RULES[kind];
  if (!rule) throw new HttpError(400, "Jenis muat naik tidak sah.");

  let folder: string | null = null;
  let scopeId: string | null = null;
  if (kind === "content") {
    if (scope !== "articles" && scope !== "videos" && scope !== "buku3")
      throw new HttpError(400, "Folder tidak sah.");
    folder = scope;
  } else {
    if (!UUID.test(scope))
      throw new HttpError(400, "Skop muat naik tidak sah.");
    scopeId = scope;
  }

  const type = sniffType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!type || !rule.types.includes(type)) {
    throw new HttpError(415, "Format fail tidak disokong.");
  }
  const maxBytes =
    type === "application/pdf"
      ? rule.maxBytes
      : Math.min(rule.maxBytes, IMAGE_MAX_BYTES);
  if (file.size === 0 || file.size > maxBytes) {
    throw new HttpError(
      413,
      `Saiz fail melebihi ${maxBytes / 1024 / 1024} MB.`,
    );
  }

  // 1. Register the file as the caller: RLS refuses callers who may not upload.
  const { data: row, error: insErr } = await db
    .from("drive_files")
    .insert({
      kind,
      scope_id: scopeId,
      folder,
      name: file.name.slice(0, 255) || "fail",
      mime_type: type,
      size_bytes: file.size,
      uploaded_by: userId,
    })
    .select("id")
    .single();
  if (insErr || !row)
    throw new HttpError(403, "Anda tidak dibenarkan memuat naik fail ini.");

  const admin = serviceClient();
  let driveId: string | null = null;
  try {
    // 2. Upload under a unique name (<row id>.<ext>): no duplicate-name clashes.
    const parent = await folderId(
      kind === "content" ? `content-${folder}` : kind,
    );
    driveId = await driveUpload(file, {
      name: `${row.id}.${EXT[type]}`,
      mimeType: type,
      parents: [parent],
      appProperties: { rowId: row.id, kind },
    });
    // 3. Link the row to the Drive file.
    const { error: updErr } = await admin
      .from("drive_files")
      .update({ drive_file_id: driveId })
      .eq("id", row.id);
    if (updErr) throw new HttpError(500, updErr.message);
  } catch (e) {
    // Undo both halves so nothing is left half-registered.
    if (driveId) await driveDelete(driveId);
    await admin.from("drive_files").delete().eq("id", row.id);
    throw e;
  }

  const id = driveId!;
  return json({
    ref: `${REF_PREFIX}${id}`,
    // Content and avatars are public: this query string is a permanent link.
    query: kind === "activity" ? null : publicQuery(id),
    name: file.name,
  });
}

function driveIds(body: Record<string, unknown>): string[] {
  const refs = Array.isArray(body.refs) ? body.refs : [];
  return refs
    .filter(
      (r): r is string => typeof r === "string" && r.startsWith(REF_PREFIX),
    )
    .map((r) => r.slice(REF_PREFIX.length))
    .slice(0, 100);
}

async function signRefs(req: Request, body: Record<string, unknown>) {
  const { db } = await callerClient(req);
  const ids = driveIds(body);
  if (ids.length === 0) return json({ urls: {} });
  // RLS leaves out the photos the caller may not see.
  const { data, error } = await db
    .from("drive_files")
    .select("drive_file_id")
    .in("drive_file_id", ids);
  if (error) throw new HttpError(400, error.message);

  const exp = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL;
  const urls: Record<string, string> = {};
  for (const { drive_file_id: id } of data) {
    urls[`${REF_PREFIX}${id}`] =
      `${publicQuery(id)}&exp=${exp}&sig=${await sign(id, exp)}`;
  }
  return json({ urls });
}

async function deleteRefs(req: Request, body: Record<string, unknown>) {
  const { db } = await callerClient(req);
  const ids = driveIds(body);
  if (ids.length === 0) return json({ deleted: [] });
  // RLS only lets the caller delete rows they may write; the Drive file follows.
  const { data, error } = await db
    .from("drive_files")
    .delete()
    .in("drive_file_id", ids)
    .select("drive_file_id");
  if (error) throw new HttpError(400, error.message);
  await Promise.all(data.map((r) => driveDelete(r.drive_file_id)));
  return json({ deleted: data.map((r) => `${REF_PREFIX}${r.drive_file_id}`) });
}

async function download(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  if (!/^[\w-]{10,200}$/.test(id)) return json({ error: "Not found" }, 404);

  const { data: row } = await serviceClient()
    .from("drive_files")
    .select("kind, name, mime_type")
    .eq("drive_file_id", id)
    .maybeSingle();
  if (!row) return json({ error: "Not found" }, 404);

  const isPrivate = row.kind === "activity";
  if (
    isPrivate &&
    !(await verify(
      id,
      url.searchParams.get("exp"),
      url.searchParams.get("sig"),
    ))
  ) {
    return json({ error: "Pautan tamat tempoh atau tidak sah." }, 403);
  }

  const range = req.headers.get("range");
  const res = await drive(
    `${DRIVE}/files/${encodeURIComponent(id)}?alt=media`,
    {
      headers: range ? { range } : {},
    },
  );
  if (!res.ok && res.status !== 206) {
    console.error("drive download failed", id, res.status, await res.text());
    return json(
      { error: "Fail tidak dapat dibaca." },
      res.status === 404 ? 404 : 502,
    );
  }

  const headers = new Headers(cors);
  headers.set("content-type", row.mime_type);
  headers.set(
    "content-disposition",
    `inline; filename*=UTF-8''${encodeURIComponent(row.name)}`,
  );
  headers.set("x-content-type-options", "nosniff");
  headers.set("accept-ranges", "bytes");
  headers.set(
    "cache-control",
    isPrivate ? "private, max-age=3000" : "public, max-age=86400",
  );
  for (const h of ["content-length", "content-range"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(res.body, { status: res.status, headers });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method === "GET") return await download(req);
    if (req.method !== "POST")
      return json({ error: "Method not allowed" }, 405);

    if (
      (req.headers.get("content-type") ?? "").startsWith("multipart/form-data")
    ) {
      return await upload(req);
    }
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    switch (body.action) {
      case "sign":
        return await signRefs(req, body);
      case "delete":
        return await deleteRefs(req, body);
      default:
        return json(
          { error: `Unknown action: ${String(body.action ?? "(none)")}` },
          400,
        );
    }
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Ralat pelayan." }, 500);
  }
});
