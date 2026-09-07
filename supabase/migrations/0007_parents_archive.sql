-- =====================================================================
-- Soft-archive for elderly residents.
--
-- Archiving hides a resident from the active lists WITHOUT deleting the row,
-- so every dependent record survives untouched: parent_anak links,
-- tracker_records (daily records + vital entries), medications and bookings
-- all keep pointing at the same parents.id. Restoring is just clearing the
-- column again.
--
-- No new policies are needed: `parents_admin_all` already limits UPDATE on
-- public.parents to admins, so archive/restore/edit are admin-only, and
-- `parents_select` is unchanged so an assigned staff / linked anak can still
-- read the history of an archived resident.
-- =====================================================================

alter table public.parents
  add column if not exists archived_at timestamptz;

-- The active list filters on `archived_at is null` on every page load.
create index if not exists idx_parents_archived_at
  on public.parents (archived_at);

comment on column public.parents.archived_at is
  'When set, the resident is archived: hidden from active lists, history kept.';
