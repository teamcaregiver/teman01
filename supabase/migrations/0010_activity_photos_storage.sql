-- =====================================================================
-- Private storage for staff activity photos (tracker_records.gambar).
--
-- Until now the staff form saved `blob:` links, which only work inside the
-- browser tab that picked the file, so nobody else could ever see the photos.
-- Photos of elderly residents must not be public either, so they now go to a
-- PRIVATE bucket and are shown through short-lived signed links.
--
-- Object path: <parent_id>/<random>.<ext>. The first folder decides access:
--   read   -> admin, the resident's assigned staff, linked anak
--   upload -> admin, the resident's assigned staff
--   delete -> admin, the resident's assigned staff
-- tracker_records.gambar stores the object paths, not links.
--
-- Safe to re-run: uses on conflict / create or replace / drop policy if exists.
-- =====================================================================

-- ---------- bucket ----------
-- public = false: no CDN link works; every read needs a signed link, which the
-- storage API only issues when the SELECT policy below allows it. Type and size
-- limits are enforced by Storage itself, whatever client uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'activity-photos', 'activity-photos', false,
  5242880, -- 5 MB, same limit as the app's image validation
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- access helpers ----------
-- The resident id from an object path, or null when the first folder is not a
-- uuid. (Casting a malformed name straight to uuid would raise inside the
-- policy instead of simply denying access.)
create or replace function private.object_parent_id(object_name text)
returns uuid language sql immutable as $$
  select case
    when split_part(object_name, '/', 1)
         ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 1)::uuid
  end;
$$;

-- ---------- policies ----------
drop policy if exists "activity photos read" on storage.objects;
create policy "activity photos read" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'activity-photos'
    and private.can_view_parent(private.object_parent_id(name))
  );

drop policy if exists "activity photos upload" on storage.objects;
create policy "activity photos upload" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'activity-photos'
    and (private.is_admin() or private.is_parent_staff(private.object_parent_id(name)))
  );

-- Lets the app clean up after a save that failed half-way.
drop policy if exists "activity photos delete" on storage.objects;
create policy "activity photos delete" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'activity-photos'
    and (private.is_admin() or private.is_parent_staff(private.object_parent_id(name)))
  );

-- ---------- drop the dead blob: links ----------
-- A `blob:` link only ever pointed at memory in the tab that created it; that
-- tab is gone, so these entries can never show a picture. Removing them keeps
-- photo counts honest. Other entries (e.g. https links from seed data) stay,
-- in their original order.
update public.tracker_records t
set gambar = (
  select jsonb_agg(g.value order by g.ord)
  from jsonb_array_elements(t.gambar) with ordinality as g(value, ord)
  where g.value #>> '{}' not like 'blob:%'
)
where jsonb_typeof(t.gambar) = 'array'
  and exists (
    select 1 from jsonb_array_elements_text(t.gambar) as e(v)
    where e.v like 'blob:%'
  );
