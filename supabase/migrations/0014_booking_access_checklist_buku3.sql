-- =====================================================================
-- Issue #10 "improvement".
--
-- 1. The Temanion assigned to an open booking can open that care
--    recipient's Rekod Harian. private.is_parent_staff() now also covers the
--    Temanion of a pending / confirmed / ongoing booking for the person, so
--    every rule built on it follows: the care recipient, their family links,
--    medications, the daily checklist and activity photos. Access ends when
--    the booking is completed or cancelled; the records that Temanion made
--    stay theirs (tracker_records rules are unchanged).
-- 2. checklist_default — the default daily Senarai Semak, edited by admin.
--    No row = the app's built-in list. Residents with their own list
--    (parent_checklists, migration 0012) keep it.
-- 3. buku3_bahagian — admin's edits to Buku 3 (Jadual Pemantauan).
--    A row with `kunci` changes one built-in section: its title, text or
--    position (null = keep the built-in value). Built-in sections are always
--    shown. A row without `kunci` is a section admin added; it may be a draft.
--
-- Safe to re-run: uses if not exists / create or replace / drop ... if exists.
-- =====================================================================

-- ---------- 1. booking access ----------
create or replace function private.is_parent_staff(p_parent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parents where id = p_parent and staff_id = auth.uid()
  ) or exists (
    select 1 from public.bookings
    where parent_id = p_parent
      and caregiver_id = auth.uid()
      and status in ('pending', 'confirmed', 'ongoing')
  );
$$;

-- 0001 checked staff_id here directly; going through the helper lets a
-- booking's Temanion see the person too.
drop policy if exists parents_select on public.parents;
create policy parents_select on public.parents
  for select using (
    private.is_admin()
    or private.is_parent_staff(id)
    or private.anak_linked_to(id)
  );

-- ---------- shared: who changed a row, and when ----------
create or replace function public.stamp_updated()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  -- auth.uid() is null only for trusted server-side callers.
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

-- ---------- 2. default checklist ----------
create table if not exists public.checklist_default (
  -- A single row: the key can only be true.
  id         boolean primary key default true,
  -- [{ "id": "c1", "label": "Mandi / kebersihan diri" }, ...]
  items      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references public.profiles(id) on delete set null
);

do $$ begin
  alter table public.checklist_default
    add constraint checklist_default_one_row check (id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.checklist_default
    add constraint checklist_default_items_array
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50);
exception when duplicate_object then null; end $$;

drop trigger if exists trg_checklist_default on public.checklist_default;
create trigger trg_checklist_default
  before insert or update on public.checklist_default
  for each row execute function public.stamp_updated();

alter table public.checklist_default enable row level security;

-- Every signed-in user reads it (Temanion tick it); only admin changes it.
drop policy if exists checklist_default_select on public.checklist_default;
create policy checklist_default_select on public.checklist_default
  for select to authenticated using (true);

drop policy if exists checklist_default_admin_all on public.checklist_default;
create policy checklist_default_admin_all on public.checklist_default
  for all using (private.is_admin()) with check (private.is_admin());

grant all on public.checklist_default to anon, authenticated, service_role;

-- ---------- 3. Buku 3 sections ----------
create table if not exists public.buku3_bahagian (
  id         uuid primary key default gen_random_uuid(),
  -- The built-in section this row changes; null for a section admin added.
  kunci      text unique,
  tajuk      text,    -- null = built-in title
  kandungan  text,    -- HTML from the editor (sanitised again on display); null = built-in text
  urutan     integer, -- position in the book; null = built-in position
  visibility content_visibility not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references public.profiles(id) on delete set null
);

do $$ begin
  alter table public.buku3_bahagian
    add constraint buku3_bahagian_kunci_check check (
      kunci is null or kunci in (
        'peranan', 'sasaran', 'profil', 'panduan',
        'rutin', 'vital', 'ubat', 'pemakanan', 'perkumuhan',
        'tingkahLaku', 'posisi', 'kesakitan', 'risikoJatuh'
      )
    );
exception when duplicate_object then null; end $$;

-- A section admin added carries its own title, text and position.
do $$ begin
  alter table public.buku3_bahagian
    add constraint buku3_bahagian_tambahan_lengkap check (
      kunci is not null or (tajuk is not null and kandungan is not null and urutan is not null)
    );
exception when duplicate_object then null; end $$;

-- Built-in sections stay in the book; only added sections can be drafts.
do $$ begin
  alter table public.buku3_bahagian
    add constraint buku3_bahagian_asal_diterbitkan check (
      kunci is null or visibility = 'published'
    );
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.buku3_bahagian
    add constraint buku3_bahagian_tajuk_panjang check (
      tajuk is null or char_length(btrim(tajuk)) between 1 and 200
    );
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.buku3_bahagian
    add constraint buku3_bahagian_kandungan_panjang check (
      kandungan is null or char_length(kandungan) <= 100000
    );
exception when duplicate_object then null; end $$;

drop trigger if exists trg_buku3_bahagian on public.buku3_bahagian;
create trigger trg_buku3_bahagian
  before insert or update on public.buku3_bahagian
  for each row execute function public.stamp_updated();

alter table public.buku3_bahagian enable row level security;

-- Same rule as articles and videos: published rows for everyone, all rows
-- for admin, and only admin writes.
drop policy if exists buku3_bahagian_select on public.buku3_bahagian;
create policy buku3_bahagian_select on public.buku3_bahagian
  for select using (visibility = 'published' or private.is_admin());

drop policy if exists buku3_bahagian_admin_all on public.buku3_bahagian;
create policy buku3_bahagian_admin_all on public.buku3_bahagian
  for all using (private.is_admin()) with check (private.is_admin());

grant all on public.buku3_bahagian to anon, authenticated, service_role;
