-- =====================================================================
-- 1. Profile avatars  — new column + a per-user storage bucket.
-- 2. Booking payment  — notes column + admin-only pricing enforcement.
-- =====================================================================

-- ---------- 1a. avatar column ----------
alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Public URL of the user''s profile photo in the `avatars` storage bucket.';

-- ---------- 1b. avatars bucket ----------
-- Public read (so the sidebar <img> works without a signed URL); each user may
-- only write inside a folder named after their own uid.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars owner manage" on storage.objects;
create policy "avatars owner manage" on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- 2a. payment notes ----------
alter table public.bookings
  add column if not exists payment_notes text;

comment on column public.bookings.payment_notes is
  'Free-text note an admin can attach to the price (deposit terms, discounts).';

-- ---------- 2b. only admins may price a booking ----------
-- `bookings_anak_update` (migration 0005) lets an anak reschedule their own
-- booking. RLS WITH CHECK cannot see the OLD row, so it could not stop them
-- from also rewriting `price` in the same request. This trigger can: it
-- compares OLD/NEW and rejects payment-field edits from non-admins, whatever
-- path the update arrives through.
create or replace function public.enforce_admin_pricing()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if new.price is distinct from old.price
     or new.payment_status is distinct from old.payment_status
     or new.payment_notes is distinct from old.payment_notes then
    raise exception 'Hanya admin dibenarkan menetapkan harga servis.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_admin_pricing on public.bookings;
create trigger trg_admin_pricing
  before update on public.bookings
  for each row execute function public.enforce_admin_pricing();
