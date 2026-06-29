-- =====================================================================
-- Allow anak to update their own pending/confirmed bookings (reschedule).
-- Anak may change date/time but NOT status — cancellation is admin-only.
-- The WITH CHECK ensures status cannot be changed to 'cancelled' or any
-- other value outside the allowed set.
-- =====================================================================

drop policy if exists bookings_anak_update on public.bookings;
create policy bookings_anak_update on public.bookings
  for update
  to authenticated
  using (anak_id = auth.uid() and status in ('pending', 'confirmed'))
  with check (anak_id = auth.uid() and status in ('pending', 'confirmed'));
