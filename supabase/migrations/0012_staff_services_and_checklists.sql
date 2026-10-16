-- =====================================================================
-- Temanion (staff) side:
--
-- 1. parent_checklists — each resident's own daily Senarai Semak.
--    A resident with no row uses the app's default list, so new residents
--    always start from the default. Once admin or the assigned staff edits
--    the list, the edited list applies to that one resident only.
--    Ticks are still stored per day in tracker_records.checklist.
--
-- 2. list_my_services() — the services (bookings) assigned to the calling
--    staff, for their Rekod Servis page. Staff cannot read bookings, parents
--    outside their assignment, or other profiles through RLS, so this returns
--    only the fields that page shows. Completed and cancelled services are
--    left out; admins still see every booking in Servis Monitoring.
--
-- Safe to re-run: uses if not exists / create or replace / drop ... if exists.
-- =====================================================================

-- ---------- 1. per-resident checklist ----------
create table if not exists public.parent_checklists (
  parent_id  uuid primary key references public.parents(id) on delete cascade,
  -- [{ "id": "c1", "label": "Mandi / kebersihan diri" }, ...]
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references public.profiles(id) on delete set null
);

do $$ begin
  alter table public.parent_checklists
    add constraint parent_checklists_items_array
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50);
exception when duplicate_object then null; end $$;

create or replace function public.stamp_parent_checklist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  -- auth.uid() is null only for trusted server-side callers.
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop trigger if exists trg_parent_checklist on public.parent_checklists;
create trigger trg_parent_checklist
  before insert or update on public.parent_checklists
  for each row execute function public.stamp_parent_checklist();

alter table public.parent_checklists enable row level security;

-- Admin, and the staff assigned to the resident, read and edit the list.
drop policy if exists parent_checklists_select on public.parent_checklists;
create policy parent_checklists_select on public.parent_checklists
  for select using (private.is_admin() or private.is_parent_staff(parent_id));

drop policy if exists parent_checklists_write on public.parent_checklists;
create policy parent_checklists_write on public.parent_checklists
  for all
  using (private.is_admin() or private.is_parent_staff(parent_id))
  with check (private.is_admin() or private.is_parent_staff(parent_id));

grant all on public.parent_checklists to anon, authenticated, service_role;

-- ---------- 2. staff service list ----------
create or replace function public.list_my_services()
returns table (
  id           uuid,
  parent_id    uuid,
  client_name  text,
  booked_by    text,
  service_name text,
  date         date,
  "time"       text,
  location     text,
  status       booking_status
)
language sql stable security definer set search_path = public as $$
  select b.id, b.parent_id, p.full_name, a.name, s.name,
         b.date, b.time, b.location, b.status
  from public.bookings b
  join public.service_types s on s.id = b.service_type_id
  left join public.parents p on p.id = b.parent_id
  left join public.profiles a on a.id = b.anak_id
  where b.caregiver_id = auth.uid()
    and b.status in ('pending', 'confirmed', 'ongoing')
  order by b.date nulls last, b.time nulls last;
$$;

-- 0001's default privileges grant every new routine to anon; this one is for
-- signed-in users only.
revoke all on function public.list_my_services() from public, anon;
grant execute on function public.list_my_services() to authenticated, service_role;
