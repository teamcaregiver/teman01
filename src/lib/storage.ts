// Supabase Storage helpers. The `content` bucket (see migrations/0002_content_storage.sql)
// is public-read, admin-write — uploads run under the logged-in admin's JWT, so
// RLS rejects them for non-admins. Returns a permanent public URL safe to store
// in articles.pdf_url / videos.pdf_url and reuse across reloads and users.
import { supabase } from "@/lib/supabase/client";

const CONTENT_BUCKET = "content";

export async function uploadContentPdf(
  file: File,
  folder: "articles" | "videos",
): Promise<{ url: string; name: string }> {
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
  folder: "articles" | "videos",
): Promise<{ url: string; name: string }> {
  const reason = validateImageFile(file);
  if (reason) throw new Error(reason);

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

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type || `image/${ext}` });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
