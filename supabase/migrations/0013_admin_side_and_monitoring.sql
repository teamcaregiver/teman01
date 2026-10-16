-- =====================================================================
-- Issue #9 "Improvement" — admin side and the monitoring reports.
--
-- 1. Temanion details on profiles (umur, jantina, bangsa, warganegara,
--    lokasi, alamat, kemahiran), in the same format admin already receives
--    applications in. Admin-managed, like the caregiver card fields.
-- 2. parents.lokasi, so admin can filter Penerima Servis by location.
-- 3. Bookings are created by admin only: the anak insert policy is dropped.
--    confirmed_at records when a booking was approved (shown on the
--    Penerima Servis cards); a trigger owns it.
-- 4. tracker_records gets the five monitoring lists from Manual 3 (Buku 3):
--    perkumuhan, tingkah laku & emosi, posisi, kesakitan, risiko jatuh.
--    Same model as vital/ubatan/makanan: a JSON array of entries per day,
--    covered by the existing tracker_records RLS.
--
-- Safe to re-run: uses if not exists / create or replace / drop ... if exists.
-- =====================================================================

-- ---------- 1. Temanion details ----------
-- Age is stored as a birth year so it does not go stale; the app converts
-- between the two. Location is one of the app's fixed list (src/lib/lokasi.ts)
-- and the street address goes in alamat.
alter table public.profiles
  add column if not exists tahun_lahir int,
  add column if not exists jantina     gender,
  add column if not exists bangsa      text,
  add column if not exists warganegara text,
  add column if not exists lokasi      text,
  add column if not exists alamat      text,
  add column if not exists kemahiran   text[];

do $$ begin
  alter table public.profiles
    add constraint profiles_tahun_lahir_range
    check (tahun_lahir is null or tahun_lahir between 1900 and 2100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_kemahiran_size
    check (kemahiran is null or cardinality(kemahiran) <= 30);
exception when duplicate_object then null; end $$;

-- Staff may still edit their own name/phone/avatar (profiles_update_self);
-- everything admin records about a Temanion stays admin-managed. Replaces the
-- 0009 version, which guarded the caregiver card fields only.
create or replace function public.enforce_admin_caregiver_details()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  if new.specialization   is distinct from old.specialization
     or new.experience_years is distinct from old.experience_years
     or new.rating        is distinct from old.rating
     or new.notes         is distinct from old.notes
     or new.tahun_lahir   is distinct from old.tahun_lahir
     or new.jantina       is distinct from old.jantina
     or new.bangsa        is distinct from old.bangsa
     or new.warganegara   is distinct from old.warganegara
     or new.lokasi        is distinct from old.lokasi
     or new.alamat        is distinct from old.alamat
     or new.kemahiran     is distinct from old.kemahiran then
    raise exception 'Hanya admin dibenarkan mengemas kini maklumat Temanion.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

-- ---------- 2. Penerima Servis location ----------
alter table public.parents
  add column if not exists lokasi text;

comment on column public.parents.lokasi is
  'Location (state / area) from the app''s fixed list; used by the admin location filter.';

-- ---------- 3. bookings ----------
-- 3a. Only admin creates bookings (bookings_admin_all already covers admin).
-- Families keep reading their own bookings (bookings_select).
drop policy if exists bookings_anak_insert on public.bookings;

-- 3b. When the booking was approved.
alter table public.bookings
  add column if not exists confirmed_at timestamptz;

comment on column public.bookings.confirmed_at is
  'When the booking first became confirmed / ongoing / completed. Set by trg_booking_confirmed.';

-- The trigger ignores any value a client sends, so it is dropped while the
-- existing rows are backfilled. The real approval time of older bookings was
-- never recorded; their creation time is the closest value available.
drop trigger if exists trg_booking_confirmed on public.bookings;

update public.bookings
set confirmed_at = created_at
where confirmed_at is null
  and status in ('confirmed', 'ongoing', 'completed');

create or replace function public.stamp_booking_confirmed()
returns trigger language plpgsql set search_path = public as $$
begin
  -- The first approval sticks, whatever happens to the status later.
  if tg_op = 'UPDATE' and old.confirmed_at is not null then
    new.confirmed_at := old.confirmed_at;
    return new;
  end if;

  new.confirmed_at := case
    when new.status in ('confirmed', 'ongoing', 'completed') then now()
  end;
  return new;
end;
$$;

create trigger trg_booking_confirmed
  before insert or update on public.bookings
  for each row execute function public.stamp_booking_confirmed();

-- ---------- 4. monitoring entries (Manual 3 / Buku 3) ----------
alter table public.tracker_records
  add column if not exists perkumuhan_entries   jsonb,
  add column if not exists tingkah_laku_entries jsonb,
  add column if not exists posisi_entries       jsonb,
  add column if not exists kesakitan_entries    jsonb,
  add column if not exists risiko_jatuh_entries jsonb;

do $$
declare
  col text;
begin
  foreach col in array array[
    'perkumuhan_entries', 'tingkah_laku_entries', 'posisi_entries',
    'kesakitan_entries', 'risiko_jatuh_entries'
  ] loop
    begin
      execute format(
        'alter table public.tracker_records add constraint %I check (%I is null or jsonb_typeof(%I) = ''array'')',
        'tracker_records_' || col || '_array', col, col
      );
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
