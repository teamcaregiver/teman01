-- =====================================================================
-- Teman / Elderly-Care — initial schema, RLS, and auth trigger
-- Apply via Supabase MCP (execute_sql) or paste into Dashboard -> SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
-- =====================================================================

-- ---------- Enums ----------
do $$ begin
  create type role as enum ('admin','staff','anak');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('active','pending','rejected','inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender as enum ('L','P');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tracker_status as enum ('normal','attention','critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending','confirmed','ongoing','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('belum_bayar','deposit','telah_bayar');
exception when duplicate_object then null; end $$;

do $$ begin
  create type service_type as enum ('companion','care');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transport_mode as enum ('sendiri','hantar','pickup');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_visibility as enum ('published','draft');
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  email      text not null,
  role       role not null default 'anak',
  status     user_status not null default 'active',
  phone      text,
  created_at timestamptz not null default now()
);

create table if not exists public.parents (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  ic                text,
  birth_date        date,
  gender            gender not null default 'P',
  address           text,
  phone             text,
  medical_condition text,
  medication        text,
  emergency_contact text,
  relationship      text,
  staff_id          uuid references public.profiles(id) on delete set null,
  jenis_darah       text,
  alahan            text,
  nama_doktor       text,
  tel_doktor        text,
  hospital_rujukan  text,
  no_insurans       text,
  status_mobiliti   text,
  status_kognitif   text,
  sekatan_pemakanan text,
  created_at        timestamptz not null default now()
);

create table if not exists public.parent_anak (
  parent_id uuid not null references public.parents(id) on delete cascade,
  anak_id   uuid not null references public.profiles(id) on delete cascade,
  primary key (parent_id, anak_id)
);

create table if not exists public.medications (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid not null references public.parents(id) on delete cascade,
  nama_ubat        text not null,
  dos              text,
  cara_pengambilan text,
  kekerapan        text,
  catatan          text,
  prn              boolean not null default false,
  prn_type         text
);

create table if not exists public.caregivers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  phone            text,
  avatar           text,
  specialization   text,
  experience_years int,
  rating           numeric,
  notes            text
);

create table if not exists public.tracker_records (
  id                  uuid primary key default gen_random_uuid(),
  parent_id           uuid not null references public.parents(id) on delete cascade,
  staff_id            uuid references public.profiles(id) on delete set null,
  date                timestamptz not null default now(),
  status              tracker_status not null default 'normal',
  vital_entries       jsonb,
  ubatan_entries      jsonb,
  makanan_entries     jsonb,
  aktiviti            text,
  aktiviti_pengesahan text,
  gambar              jsonb,
  checklist           jsonb,
  catatan_khas        text,
  edited_by_admin     boolean default false,
  edited_at           timestamptz,
  edit_allowed        boolean default false,
  created_at          timestamptz not null default now()
);

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  anak_id        uuid not null references public.profiles(id) on delete cascade,
  parent_id      uuid references public.parents(id) on delete set null,
  service_type   service_type not null,
  date           date,
  time           text,
  transport      transport_mode,
  location       text,
  notes          text,
  status         booking_status not null default 'pending',
  created_at     timestamptz not null default now(),
  caregiver_id   uuid references public.caregivers(id) on delete set null,
  price          numeric,
  payment_status payment_status
);

create table if not exists public.articles (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  topic       text,
  subtopic    text,
  cover_image text,
  body        text,
  pdf_url     text,
  pdf_name    text,
  youtube_url text,
  visibility  content_visibility not null default 'draft',
  views       int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  topic       text,
  subtopic    text,
  url         text,
  description text,
  pdf_url     text,
  pdf_name    text,
  visibility  content_visibility not null default 'draft',
  views       int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_parents_staff on public.parents(staff_id);
create index if not exists idx_parent_anak_anak on public.parent_anak(anak_id);
create index if not exists idx_medications_parent on public.medications(parent_id);
create index if not exists idx_tracker_parent on public.tracker_records(parent_id);
create index if not exists idx_tracker_staff on public.tracker_records(staff_id);
create index if not exists idx_bookings_anak on public.bookings(anak_id);

-- ---------- Authorization helpers (private schema = NOT exposed via API) ----------
create schema if not exists private;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function private.user_role(uid uuid)
returns role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = uid;
$$;

-- Cross-table membership checks. SECURITY DEFINER => they run WITHOUT RLS, which
-- is essential: it breaks the parents <-> parent_anak policy recursion that would
-- otherwise occur if these checks were inlined as RLS subqueries.
create or replace function private.anak_linked_to(p_parent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_anak
    where parent_id = p_parent and anak_id = auth.uid()
  );
$$;

create or replace function private.is_parent_staff(p_parent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parents where id = p_parent and staff_id = auth.uid()
  );
$$;

-- True if the caller (admin / assigned staff / linked anak) may view this elderly.
create or replace function private.can_view_parent(p_parent uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_admin()
      or private.is_parent_staff(p_parent)
      or private.anak_linked_to(p_parent);
$$;

-- ---------- New-user trigger ----------
-- Role comes ONLY from app_metadata (settable solely via the service role), so a
-- self-signing user cannot escalate by passing role in user_metadata. Name/phone
-- (non-sensitive) come from user_metadata. Defaults to a 'anak'/'active' account.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role   role;
  v_status user_status;
begin
  v_role := coalesce((new.raw_app_meta_data->>'role')::role, 'anak');
  v_status := case when v_role = 'staff' then 'pending'::user_status else 'active'::user_status end;

  insert into public.profiles (id, name, email, role, status, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    v_role,
    v_status,
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles        enable row level security;
alter table public.parents         enable row level security;
alter table public.parent_anak     enable row level security;
alter table public.medications     enable row level security;
alter table public.caregivers      enable row level security;
alter table public.tracker_records enable row level security;
alter table public.bookings        enable row level security;
alter table public.articles        enable row level security;
alter table public.videos          enable row level security;

-- profiles: read self or admin; update self; admin manages all.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or private.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (private.is_admin()) with check (private.is_admin());

-- parents: admin all; staff sees assigned; anak sees linked; anak/admin may insert.
drop policy if exists parents_select on public.parents;
create policy parents_select on public.parents
  for select using (
    private.is_admin()
    or staff_id = auth.uid()
    or private.anak_linked_to(id)
  );

drop policy if exists parents_admin_all on public.parents;
create policy parents_admin_all on public.parents
  for all using (private.is_admin()) with check (private.is_admin());

drop policy if exists parents_anak_insert on public.parents;
create policy parents_anak_insert on public.parents
  for insert with check (private.user_role(auth.uid()) = 'anak');

-- parent_anak: admin all; anak sees/links own rows; assigned staff can read.
drop policy if exists parent_anak_select on public.parent_anak;
create policy parent_anak_select on public.parent_anak
  for select using (
    private.is_admin()
    or anak_id = auth.uid()
    or private.is_parent_staff(parent_id)
  );

drop policy if exists parent_anak_admin_all on public.parent_anak;
create policy parent_anak_admin_all on public.parent_anak
  for all using (private.is_admin()) with check (private.is_admin());

drop policy if exists parent_anak_anak_insert on public.parent_anak;
create policy parent_anak_anak_insert on public.parent_anak
  for insert with check (anak_id = auth.uid());

-- medications: admin write; visible to assigned staff + linked anak.
drop policy if exists medications_select on public.medications;
create policy medications_select on public.medications
  for select using (private.can_view_parent(parent_id));

drop policy if exists medications_admin_all on public.medications;
create policy medications_admin_all on public.medications
  for all using (private.is_admin()) with check (private.is_admin());

-- caregivers: any signed-in user can read; admin writes.
drop policy if exists caregivers_select on public.caregivers;
create policy caregivers_select on public.caregivers
  for select using (auth.uid() is not null);

drop policy if exists caregivers_admin_all on public.caregivers;
create policy caregivers_admin_all on public.caregivers
  for all using (private.is_admin()) with check (private.is_admin());

-- tracker_records: admin all; staff owns; linked anak reads.
drop policy if exists tracker_select on public.tracker_records;
create policy tracker_select on public.tracker_records
  for select using (
    private.is_admin()
    or staff_id = auth.uid()
    or private.anak_linked_to(parent_id)
  );

drop policy if exists tracker_staff_write on public.tracker_records;
create policy tracker_staff_write on public.tracker_records
  for all using (private.is_admin() or staff_id = auth.uid())
  with check (private.is_admin() or staff_id = auth.uid());

-- bookings: admin all; anak owns own bookings.
drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings
  for select using (private.is_admin() or anak_id = auth.uid());

drop policy if exists bookings_anak_insert on public.bookings;
create policy bookings_anak_insert on public.bookings
  for insert with check (anak_id = auth.uid());

drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all using (private.is_admin()) with check (private.is_admin());

-- content: published visible to all signed-in users; admin sees/writes everything.
drop policy if exists articles_select on public.articles;
create policy articles_select on public.articles
  for select using (visibility = 'published' or private.is_admin());

drop policy if exists articles_admin_all on public.articles;
create policy articles_admin_all on public.articles
  for all using (private.is_admin()) with check (private.is_admin());

drop policy if exists videos_select on public.videos;
create policy videos_select on public.videos
  for select using (visibility = 'published' or private.is_admin());

drop policy if exists videos_admin_all on public.videos;
create policy videos_admin_all on public.videos
  for all using (private.is_admin()) with check (private.is_admin());

-- ---------- Grants ----------
-- RLS (above) decides which ROWS each role may see; these table-level privileges
-- are still required for a role to touch a table AT ALL. Supabase normally adds
-- these automatically for objects created in the SQL Editor, but that automation
-- does not fire when the schema is applied another way (MCP, a direct connection
-- as a non-default role) — which leaves even the service_role key getting
-- "permission denied for table". Setting them explicitly makes this migration
-- self-contained regardless of how it is applied. Safe because RLS is enabled on
-- every table above, so these grants only let RLS do its job.
grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all routines  in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- Future objects created in this schema inherit the same grants.
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines  to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
