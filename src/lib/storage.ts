// Supabase Storage helpers. The `content` bucket (see migrations/0002_content_storage.sql)
// is public-read, admin-write — uploads run under the logged-in admin's JWT, so
// RLS rejects them for non-admins. Returns a permanent public URL safe to store
// in articles.pdf_url / videos.pdf_url and reuse across reloads and users.
//
// With VITE_STORAGE_BACKEND=gdrive, new uploads go to Google Drive through the
// `drive-files` Edge Function instead (src/lib/drive-storage.ts). The return
// shapes stay the same, so callers don't change. Files already in Supabase
// Storage keep working either way, and so do Drive files after switching back.
import { supabase } from "@/lib/supabase/client";
import {
  driveEnabled,
  isDriveRef,
  removeDriveRefs,
  signDriveRefs,
  uploadToDrive,
} from "@/lib/drive-storage";

const CONTENT_BUCKET = "content";

/** Folder inside the content bucket (or Drive) for each kind of content. */
export type ContentFolder = "articles" | "videos" | "buku3";

export const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB

/** Human-readable reason the PDF is unusable, or null when it is fine. */
export function validatePdfFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type !== "application/pdf" && ext !== "pdf") {
    return "Format tidak disokong. Sila muat naik fail PDF.";
  }
  if (file.size > MAX_PDF_BYTES) {
    return "Saiz PDF melebihi 20 MB. Sila guna fail yang lebih kecil.";
  }
  return null;
}

export async function uploadContentPdf(
  file: File,
  folder: ContentFolder,
): Promise<{ url: string; name: string }> {
  const reason = validatePdfFile(file);
  if (reason) throw new Error(reason);

  if (driveEnabled()) {
    const { url, name } = await uploadToDrive(file, "content", folder);
    return { url: url!, name };
  }

  // Random key avoids collisions / weird-char issues; the human-readable name is
  // kept separately in pdf_name.
  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(CONTENT_BUCKET)
    .upload(path, file, { contentType: file.type || "application/pdf" });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(CONTENT_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, name: file.name };
}

// ---------- cover images ----------
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Accept attribute for the cover-image file picker. */
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Human-readable reason the file is unusable, or null when it is fine. */
export function validateImageFile(file: File): string | null {
  const okType = (IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
  // Some browsers report an empty type for webp; fall back to the extension.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const okExt = ["jpg", "jpeg", "png", "webp"].includes(ext);
  if (!okType && !okExt) {
    return "Format tidak disokong. Gunakan JPG, JPEG, PNG atau WebP.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Saiz gambar melebihi 5 MB. Sila guna gambar yang lebih kecil.";
  }
  return null;
}

/**
 * Upload a cover image to the same public `content` bucket used for PDFs and
 * return its permanent public URL (stored in articles.cover_image).
 */
export async function uploadContentImage(
  file: File,
  folder: ContentFolder,
): Promise<{ url: string; name: string }> {
  const reason = validateImageFile(file);
  if (reason) throw new Error(reason);

  if (driveEnabled()) {
    const { url, name } = await uploadToDrive(file, "content", folder);
    return { url: url!, name };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/cover-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(CONTENT_BUCKET)
    .upload(path, file, { contentType: file.type || `image/${ext}` });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(CONTENT_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, name: file.name };
}

/** True when the string is a usable http(s) image source. */
export function isValidImageUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ---------- activity photos (private) ----------
// Photos of residents live in the PRIVATE `activity-photos` bucket
// (migrations/0010_activity_photos_storage.sql). tracker_records.gambar keeps
// the object paths (or `gdrive:<id>` refs when stored on Google Drive); screens
// turn them into short-lived signed links.
const ACTIVITY_BUCKET = "activity-photos";

/** How long a signed photo link stays valid, in seconds. */
export const ACTIVITY_PHOTO_URL_TTL = 60 * 60;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * True for a stored reference that needs signing (a Storage object path or a
 * `gdrive:` ref); false for links such as https: or blob:.
 */
export function isActivityPhotoPath(value: string): boolean {
  return isDriveRef(value) || !/^[a-z][a-z0-9+.-]*:/i.test(value);
}

/**
 * Upload photos into the resident's folder. Storage RLS only accepts the
 * resident's assigned staff (or an admin), so the folder is not optional.
 * Resolves to the object paths to save; if any upload fails, the ones that
 * succeeded are removed again and the error is rethrown.
 */
export async function uploadActivityPhotos(parentId: string, files: File[]): Promise<string[]> {
  const results = await Promise.allSettled(
    files.map(async (file) => {
      const reason = validateImageFile(file);
      if (reason) throw new Error(reason);

      if (driveEnabled()) return (await uploadToDrive(file, "activity", parentId)).ref;

      // validateImageFile passed on the MIME type or the extension, so one
      // of the two gives a type the bucket accepts.
      const nameExt = file.name.split(".").pop()?.toLowerCase() ?? "";
      const type = (IMAGE_MIME_TYPES as readonly string[]).includes(file.type)
        ? file.type
        : MIME_BY_EXT[nameExt];
      const path = `${parentId}/${crypto.randomUUID()}.${type.split("/")[1]}`;

      const { error } = await supabase.storage
        .from(ACTIVITY_BUCKET)
        .upload(path, file, { contentType: type });
      if (error) throw new Error(error.message);
      return path;
    }),
  );

  const paths = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
  if (failed) {
    await removeActivityPhotos(paths);
    throw failed.reason instanceof Error ? failed.reason : new Error("Muat naik gambar gagal");
  }
  return paths;
}

/** Best-effort delete, used to clean up after a failed save. */
export async function removeActivityPhotos(paths: string[]): Promise<void> {
  const objects = paths.filter((p) => !isDriveRef(p));
  await Promise.allSettled([
    removeDriveRefs(paths.filter(isDriveRef)),
    objects.length > 0 ? supabase.storage.from(ACTIVITY_BUCKET).remove(objects) : null,
  ]);
}

/** Signed links for object paths, keyed by path. Paths the caller may not read are left out. */
export async function signActivityPhotos(paths: string[]): Promise<Record<string, string>> {
  const objects = paths.filter((p) => !isDriveRef(p));
  const urls: Record<string, string> = await signDriveRefs(paths.filter(isDriveRef));
  if (objects.length === 0) return urls;

  const { data, error } = await supabase.storage
    .from(ACTIVITY_BUCKET)
    .createSignedUrls(objects, ACTIVITY_PHOTO_URL_TTL);
  if (error) throw new Error(error.message);

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) urls[item.path] = item.signedUrl;
  }
  return urls;
}

// ---------- profile avatars ----------
const AVATAR_BUCKET = "avatars";

/**
 * Upload a profile photo. Storage RLS only allows writing inside a folder named
 * after the uploader's own uid, so the path prefix is not optional.
 */
export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<{ url: string; path: string }> {
  const reason = validateImageFile(file);
  if (reason) throw new Error(reason);

  if (driveEnabled()) {
    const { ref, url } = await uploadToDrive(file, "avatar", userId);
    return { url: url!, path: ref };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type || `image/${ext}` });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Best-effort delete of an avatar from uploadAvatar, e.g. when saving it failed. */
export async function removeAvatarFile(path: string): Promise<void> {
  if (isDriveRef(path)) await removeDriveRefs([path]);
  else await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}
