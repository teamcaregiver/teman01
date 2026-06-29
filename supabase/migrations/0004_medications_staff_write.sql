-- =====================================================================
-- Teman / Elderly-Care — let assigned staff manage a parent's medication list
-- Apply via Supabase MCP (execute_sql) or paste into Dashboard -> SQL Editor.
-- Safe to re-run: uses DROP POLICY IF EXISTS.
-- =====================================================================

-- The staff tracker page (/staf/tracker/$parentId/ubat -> "Tambah Ubat")
-- inserts rows into public.medications, but 0001 only granted writes to admins
-- (medications_admin_all). An assigned staff member therefore hit
-- "new row violates row-level security policy for table medications" (403).
--
-- Grant the staff assigned to a parent full write (INSERT/UPDATE/DELETE) on that
-- parent's medications — exactly the pattern used by tracker_staff_write. The
-- private.is_parent_staff() helper is SECURITY DEFINER, so it runs without RLS
-- and avoids policy recursion. SELECT is already covered by medications_select
-- (private.can_view_parent). admin is included here too so the rule is
-- self-contained, but medications_admin_all already covers the admin case.
drop policy if exists medications_staff_write on public.medications;
create policy medications_staff_write on public.medications
  for all
  to authenticated
  using (private.is_admin() or private.is_parent_staff(parent_id))
  with check (private.is_admin() or private.is_parent_staff(parent_id));
