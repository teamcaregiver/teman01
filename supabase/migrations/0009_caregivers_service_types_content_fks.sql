-- =====================================================================
-- Replace loose text / enum lookups with real foreign keys.
--
-- 1. Caregivers are staff accounts. The standalone `caregivers` table is
--    dropped: its detail columns move onto `profiles`, and
--    bookings.caregiver_id now references profiles(id). Only a profile with
--    role 'staff' may be assigned, and only an admin may assign one.
-- 2. bookings.service_type (enum) -> service_type_id, a foreign key to a new
--    `service_types` lookup table.
-- 3. articles / videos topic + subtopic (text names) -> topic_id /
--    subtopic_id, foreign keys to the taxonomy tables from 0003. The
--    subtopic must belong to the chosen topic.
--
-- Existing rows are converted in place before the old columns are dropped.
-- Safe to re-run: each conversion step is skipped once it has happened.
-- =====================================================================

-- ---------- 1a. caregiver details live on the staff profile ----------
alter table public.profiles
  add column if not exists specialization   text,
  add column if not exists experience_years int,
  add column if not exists rating           numeric,
  add column if not exists notes            text;

-- ---------- 1b. move caregiver data onto staff profiles ----------
alter table public.bookings drop constraint if exists bookings_caregiver_id_fkey;

do $$
begin
  if to_regclass('public.caregivers') is null then
    return;
  end if;

  -- A legacy caregiver row maps to a staff account only when exactly one
  -- staff profile has the same name (ignoring case and outer spaces).
  create temp table caregiver_map on commit drop as
    select c.id as caregiver_id, (array_agg(p.id))[1] as staff_id
    from public.caregivers c
    join public.profiles p
      on p.role = 'staff' and lower(btrim(p.name)) = lower(btrim(c.name))
    group by c.id
    having count(*) = 1;

  -- Copy the details across without overwriting anything already set.
  update public.profiles p
  set specialization   = coalesce(p.specialization, c.specialization),
      experience_years = coalesce(p.experience_years, c.experience_years),
      rating           = coalesce(p.rating, c.rating),
      notes            = coalesce(p.notes, c.notes)
  from caregiver_map m
  join public.caregivers c on c.id = m.caregiver_id
  where p.id = m.staff_id;

  update public.bookings b
  set caregiver_id = m.staff_id
  from caregiver_map m
  where b.caregiver_id = m.caregiver_id;

  -- Assignments with no matching staff account are cleared; admin re-assigns
  -- them from Servis Monitoring.
  update public.bookings
  set caregiver_id = null
  where caregiver_id is not null
    and caregiver_id not in (select id from public.profiles where role = 'staff');

  drop table public.caregivers;
end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_rating_range check (rating is null or rating between 0 and 5);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_experience_years_nonnegative
    check (experience_years is null or experience_years >= 0);
exception when duplicate_object then null; end $$;

alter table public.bookings
  add constraint bookings_caregiver_id_fkey
  foreign key (caregiver_id) references public.profiles(id) on delete set null;

create index if not exists idx_bookings_caregiver on public.bookings(caregiver_id);

-- ---------- 1c. caregiver guards ----------
-- Only admins assign a caregiver, and the assignee must be a staff account.
-- auth.uid() is null only for trusted server-side callers (service role, SQL
-- editor): RLS already stops anonymous requests from writing to bookings.
create or replace function public.enforce_booking_caregiver()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- NEW/OLD kept in separate branches: OLD is unassigned on INSERT.
  if tg_op = 'UPDATE' then
    if new.caregiver_id is not distinct from old.caregiver_id then
      return new;
    end if;
  elsif new.caregiver_id is null then
    return new;
  end if;

  if auth.uid() is not null and not private.is_admin() then
    raise exception 'Hanya admin dibenarkan menetapkan caregiver.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.caregiver_id is not null
     and private.user_role(new.caregiver_id) is distinct from 'staff' then
    raise exception 'Caregiver mesti akaun dengan peranan staf.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_booking_caregiver on public.bookings;
create trigger trg_booking_caregiver
  before insert or update on public.bookings
  for each row execute function public.enforce_booking_caregiver();

-- Staff may still edit their own name/phone/avatar (profiles_update_self), but
-- the caregiver details shown to families are admin-managed, as they were in
-- the old `caregivers` table. RLS WITH CHECK cannot see OLD; a trigger can.
create or replace function public.enforce_admin_caregiver_details()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  if new.specialization   is distinct from old.specialization
     or new.experience_years is distinct from old.experience_years
     or new.rating        is distinct from old.rating
     or new.notes         is distinct from old.notes then
    raise exception 'Hanya admin dibenarkan mengemas kini maklumat caregiver.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_admin_caregiver_details on public.profiles;
create trigger trg_admin_caregiver_details
  before update on public.profiles
  for each row execute function public.enforce_admin_caregiver_details();

-- ---------- 1d. caregiver directory ----------
-- profiles RLS only exposes a user's own row (admins see all), but a family
-- must see the staff assigned to its bookings. This returns the caregiver card
-- fields only — never another account's email — to:
--   admin -> every staff account
--   staff -> themselves
--   anak  -> staff assigned to one of their own bookings
create or replace function public.list_caregivers()
returns table (
  id               uuid,
  name             text,
  phone            text,
  avatar_url       text,
  status           user_status,
  specialization   text,
  experience_years int,
  rating           numeric,
  notes            text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.phone, p.avatar_url, p.status,
         p.specialization, p.experience_years, p.rating, p.notes
  from public.profiles p
  where p.role = 'staff'
    and (
      private.is_admin()
      or p.id = auth.uid()
      or exists (
        select 1 from public.bookings b
        where b.caregiver_id = p.id and b.anak_id = auth.uid()
      )
    )
  order by p.name;
$$;

-- 0001's default privileges grant every new routine to anon; this one is for
-- signed-in users only.
revoke all on function public.list_caregivers() from public, anon;
grant execute on function public.list_caregivers() to authenticated, service_role;

-- ---------- 2. service types ----------
create table if not exists public.service_types (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- Same model as topics/subtopics: signed-in users read (anak picks one when
-- booking), admins write.
alter table public.service_types enable row level security;

drop policy if exists service_types_select on public.service_types;
create policy service_types_select on public.service_types
  for select using (auth.uid() is not null);

drop policy if exists service_types_admin_all on public.service_types;
create policy service_types_admin_all on public.service_types
  for all using (private.is_admin()) with check (private.is_admin());

grant all on public.service_types to anon, authenticated, service_role;

-- Matches the old `service_type` enum values, so existing bookings convert 1:1.
insert into public.service_types (code, name, description) values
  ('companion', 'Companion', 'Teman & sokongan harian tanpa penjagaan perubatan.'),
  ('care',      'Care',      'Penjagaan termasuk pemantauan kesihatan & ubatan.')
on conflict (code) do nothing;

alter table public.bookings add column if not exists service_type_id uuid;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'service_type'
  ) then
    update public.bookings b
    set service_type_id = s.id
    from public.service_types s
    where s.code = b.service_type::text
      and b.service_type_id is null;

    alter table public.bookings drop column service_type;
  end if;
end $$;

drop type if exists public.service_type;

alter table public.bookings alter column service_type_id set not null;

alter table public.bookings drop constraint if exists bookings_service_type_id_fkey;
alter table public.bookings
  add constraint bookings_service_type_id_fkey
  foreign key (service_type_id) references public.service_types(id) on delete restrict;

create index if not exists idx_bookings_service_type on public.bookings(service_type_id);

-- ---------- 3. article / video taxonomy ----------
-- Makes (id, topic_id) a foreign-key target, so the database itself rejects a
-- subtopic that belongs to a different topic.
do $$ begin
  alter table public.subtopics
    add constraint subtopics_id_topic_id_key unique (id, topic_id);
exception when duplicate_table or duplicate_object then null; end $$;

-- articles and videos share the same taxonomy, so both get identical treatment.
-- A topic or subtopic still used by content cannot be deleted (restrict);
-- renaming one is reflected everywhere automatically.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['articles', 'videos'] loop
    execute format($q$
      alter table public.%I
        add column if not exists topic_id    uuid,
        add column if not exists subtopic_id uuid
    $q$, tbl);

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = tbl and column_name = 'topic'
    ) then
      -- Register any name in use but missing from the taxonomy first, so no
      -- row loses its topic/subtopic in the conversion.
      execute format($q$
        insert into public.topics (name)
        select distinct btrim(topic) from public.%I
        where nullif(btrim(topic), '') is not null
        on conflict (name) do nothing
      $q$, tbl);

      execute format($q$
        insert into public.subtopics (topic_id, name)
        select distinct t.id, btrim(x.subtopic)
        from public.%I x
        join public.topics t on t.name = btrim(x.topic)
        where nullif(btrim(x.subtopic), '') is not null
        on conflict (topic_id, name) do nothing
      $q$, tbl);

      execute format($q$
        update public.%I x
        set topic_id = t.id
        from public.topics t
        where t.name = btrim(x.topic)
      $q$, tbl);

      execute format($q$
        update public.%I x
        set subtopic_id = s.id
        from public.subtopics s
        where s.topic_id = x.topic_id
          and s.name = btrim(x.subtopic)
      $q$, tbl);

      execute format('alter table public.%I drop column topic, drop column subtopic', tbl);
    end if;

    -- Dropped and re-added so a re-run converges on the same definitions.
    execute format($q$
      alter table public.%I
        drop constraint if exists %I,
        drop constraint if exists %I,
        drop constraint if exists %I
    $q$, tbl, tbl || '_topic_id_fkey', tbl || '_subtopic_fkey', tbl || '_subtopic_needs_topic');

    -- The composite FK is skipped by Postgres when topic_id is null (MATCH
    -- SIMPLE), hence the check: a subtopic always needs its topic.
    execute format($q$
      alter table public.%I
        add constraint %I foreign key (topic_id)
          references public.topics (id) on delete restrict,
        add constraint %I foreign key (subtopic_id, topic_id)
          references public.subtopics (id, topic_id) on delete restrict,
        add constraint %I check (subtopic_id is null or topic_id is not null)
    $q$, tbl, tbl || '_topic_id_fkey', tbl || '_subtopic_fkey', tbl || '_subtopic_needs_topic');

    execute format('create index if not exists %I on public.%I (topic_id)', 'idx_' || tbl || '_topic', tbl);
    execute format('create index if not exists %I on public.%I (subtopic_id)', 'idx_' || tbl || '_subtopic', tbl);
  end loop;
end $$;
