-- =====================================================================
-- Teman / Elderly-Care — content storage bucket (PDF uploads)
-- Apply via Supabase MCP (execute_sql) or paste into Dashboard -> SQL Editor.
-- Safe to re-run: uses on conflict / drop policy if exists.
-- =====================================================================

-- Public bucket for article/video PDF attachments. `public = true` means the
-- files are served read-only over the public CDN URL (getPublicUrl), so anak
-- can open a PDF without auth. Writes are still locked down by the policy below.
insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do update set public = excluded.public;

-- Only admins may upload / replace / delete objects in this bucket. Reuses the
-- same private.is_admin() helper the table policies use. A single FOR ALL policy
-- covers INSERT + SELECT + UPDATE + DELETE — Storage upsert needs all of
-- INSERT/SELECT/UPDATE, which this grants. Public reads bypass RLS via the
-- public CDN endpoint, so no separate SELECT policy is required for viewers.
drop policy if exists "content admin manage" on storage.objects;
create policy "content admin manage" on storage.objects
  for all
  to authenticated
  using (bucket_id = 'content' and private.is_admin())
  with check (bucket_id = 'content' and private.is_admin());
