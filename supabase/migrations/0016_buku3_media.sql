-- =====================================================================
-- Buku 3 (Jadual Pemantauan) sections get the same attachments as Artikel:
-- a cover image, a PDF and a YouTube link. Any section can have them, built-in
-- or added. "Kembalikan teks asal" only resets the title and text, so the
-- attachments stay. Same columns and meaning as public.articles.
--
-- Safe to re-run: uses add column if not exists / duplicate_object guards.
-- =====================================================================

alter table public.buku3_bahagian
  add column if not exists cover_image text,
  add column if not exists pdf_url     text,
  add column if not exists pdf_name    text,
  add column if not exists youtube_url text;

do $$ begin
  alter table public.buku3_bahagian
    add constraint buku3_bahagian_lampiran_panjang check (
      coalesce(char_length(cover_image), 0) <= 2048
      and coalesce(char_length(pdf_url), 0) <= 2048
      and coalesce(char_length(pdf_name), 0) <= 255
      and coalesce(char_length(youtube_url), 0) <= 2048
    );
exception when duplicate_object then null; end $$;
