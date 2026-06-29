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
