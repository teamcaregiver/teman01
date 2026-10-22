-- =====================================================================
-- Google Drive file registry (see docs/GOOGLE-DRIVE-STORAGE.md).
--
-- When VITE_STORAGE_BACKEND=gdrive, uploads go to one app-owned Google Drive
-- through the `drive-files` Edge Function. Drive itself knows nothing about
-- our users, so every Drive file gets a row here, and the RLS below decides who
-- may upload, see and delete it. The Edge Function runs those checks under the
-- CALLER's JWT, so the rules are the same ones the Storage buckets use:
--
--   kind      scope_id       read                         upload / delete
--   content   (none)         everyone                     admin
--   avatar    owner's uid    everyone                     the owner
--   activity  parent_id      admin, staff, linked anak    admin, assigned staff
--
-- Records keep a stable reference to the Drive file id:
--   tracker_records.gambar      -> 'gdrive:<drive_file_id>'
--   articles/videos/profiles    -> the function's public link (?id=<drive_file_id>)
--
-- Safe to re-run: uses if not exists / drop policy if exists.
-- =====================================================================

create table if not exists public.drive_files (
  id            uuid primary key default gen_random_uuid(),
  -- Null only while the upload is in flight; the function fills it in.
  drive_file_id text unique,
  kind          text not null check (kind in ('content', 'avatar', 'activity')),
  scope_id      uuid,
  -- 'articles' / 'videos' for content; null otherwise.
  folder        text,
  -- Original file name as picked by the user (the Drive name is <id>.<ext>).
  name          text not null,
  mime_type     text not null,
  size_bytes    bigint not null check (size_bytes > 0),
  uploaded_by   uuid default auth.uid() references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  check (kind = 'content' or scope_id is not null)
);

create index if not exists idx_drive_files_scope on public.drive_files(kind, scope_id);

alter table public.drive_files enable row level security;

-- Write rule shared by insert and delete.
create or replace function private.can_write_drive_file(p_kind text, p_scope uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case p_kind
    when 'content'  then private.is_admin()
    when 'avatar'   then p_scope = auth.uid()
    when 'activity' then private.is_admin() or private.is_parent_staff(p_scope)
    else false
  end;
$$;

drop policy if exists "drive files read" on public.drive_files;
create policy "drive files read" on public.drive_files
  for select
  to anon, authenticated
  using (
    kind in ('content', 'avatar')
    or (kind = 'activity' and private.can_view_parent(scope_id))
  );

drop policy if exists "drive files insert" on public.drive_files;
create policy "drive files insert" on public.drive_files
  for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and drive_file_id is null
    and private.can_write_drive_file(kind, scope_id)
  );

drop policy if exists "drive files delete" on public.drive_files;
create policy "drive files delete" on public.drive_files
  for delete
  to authenticated
  using (private.can_write_drive_file(kind, scope_id));

-- No update policy: only the Edge Function (service role) sets drive_file_id.

grant all on public.drive_files to anon, authenticated, service_role;
