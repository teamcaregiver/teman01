-- =====================================================================
-- Admin role management guards.
--
-- 1. The system must always keep at least one ACTIVE admin. Enforced by a
--    BEFORE UPDATE/DELETE trigger on profiles, so it holds for every path:
--    the SPA (RLS/anon key), the admin-users Edge Function (service role),
--    and manual SQL. RLS policies cannot express this, triggers can.
--
-- 2. Users may still edit their own name/phone, but no longer their own
--    `role` or `status` — that was a privilege-escalation hole (a staff
--    account could promote itself to admin). Role/status changes are now
--    admin-only, via the separate profiles_admin_all policy.
-- =====================================================================

-- ---------- 1. at least one active admin ----------
create or replace function public.enforce_last_active_admin()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_remaining int;
begin
  -- NOTE: NEW is unassigned in a DELETE trigger and PL/pgSQL does not promise
  -- short-circuit evaluation, so every NEW reference below sits inside an
  -- explicit `tg_op = 'UPDATE'` branch.

  -- Only care about rows that ARE currently an active admin.
  if not (old.role = 'admin' and old.status = 'active') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  -- Still an active admin afterwards? Nothing to guard.
  if tg_op = 'UPDATE' then
    if new.role = 'admin' and new.status = 'active' then
      return new;
    end if;
  end if;

  select count(*) into v_remaining
  from public.profiles
  where role = 'admin' and status = 'active' and id <> old.id;

  if v_remaining = 0 then
    raise exception
      'Sekurang-kurangnya satu akaun Admin aktif mesti kekal dalam sistem.'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists trg_last_active_admin on public.profiles;
create trigger trg_last_active_admin
  before update or delete on public.profiles
  for each row execute function public.enforce_last_active_admin();

-- ---------- 2. self-update may not change role / status ----------
-- SECURITY DEFINER lookup so the WITH CHECK below does not re-enter RLS on
-- profiles (which would recurse through profiles_select).
create or replace function private.user_status(uid uuid)
returns user_status language sql stable security definer set search_path = public as $$
  select status from public.profiles where id = uid;
$$;

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = private.user_role(auth.uid())
    and status = private.user_status(auth.uid())
  );
