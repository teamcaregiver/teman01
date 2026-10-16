-- =====================================================================
-- Borang: a shared board of form links for admin and staff.
--
-- Admin and active staff post links to forms (Google Forms, Microsoft Forms,
-- Jotform, ...) for the whole team. A link is never hard-deleted:
--   archived_at -> hidden from the active list, can be unarchived
--   deleted_at  -> soft delete; hidden from staff, admins can still see and
--                  restore it. There is no DELETE policy, so no API call can
--                  remove a row for real.
--
-- Who may do what:
--   read                     -> admin (every row), active staff (non-deleted)
--   add                      -> admin, active staff
--   edit / archive / delete  -> admin (any link), staff (their own links)
--   restore a deleted link   -> admin
--
-- Only page links are accepted. Anything that looks like an API endpoint, a
-- raw IP address or carries an access key is rejected (form_link_problem).
--
-- Safe to re-run: uses if not exists / create or replace / drop ... if exists.
-- =====================================================================

-- ---------- table ----------
create table if not exists public.form_links (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  url             text not null,
  description     text,
  created_by      uuid default auth.uid() references public.profiles(id) on delete set null,
  -- Snapshot of the author's name: staff cannot read other profiles, but
  -- everyone on the board should see who posted a link.
  created_by_name text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  deleted_at      timestamptz,
  deleted_by      uuid references public.profiles(id) on delete set null
);

do $$ begin
  alter table public.form_links
    add constraint form_links_title_length check (char_length(title) between 1 and 120);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.form_links
    add constraint form_links_description_length
    check (description is null or char_length(description) <= 500);
exception when duplicate_object then null; end $$;

-- ---------- access helpers ----------
-- Pending / rejected / inactive staff are kept out even with a live session.
create or replace function private.is_active_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'staff' and status = 'active'
  );
$$;

-- Why a link is refused, or null when it is fine. The app runs the same
-- checks first (checkFormLink in src/lib/form-links.ts) and stores the
-- normalised link; this is the backstop for direct API calls, so keep the two
-- word lists in step.
create or replace function private.form_link_problem(p_url text)
returns text language plpgsql immutable as $$
declare
  v_rest  text;
  v_auth  text;
  v_host  text;
  v_path  text;
  v_query text;
begin
  if p_url is null or p_url = '' then
    return 'Sila masukkan pautan borang.';
  end if;
  if char_length(p_url) > 2048 then
    return 'Pautan terlalu panjang.';
  end if;
  if p_url !~* '^https://' then
    return 'Hanya pautan https:// dibenarkan.';
  end if;
  if p_url ~ '\s' then
    return 'Pautan tidak sah. Semak semula pautan yang ditampal.';
  end if;

  v_rest  := substr(p_url, 9); -- after "https://"
  v_auth  := lower(substring(v_rest from '^[^/?#]*'));
  v_path  := lower(coalesce(substring(v_rest from '^[^/?#]*(/[^?#]*)'), '/'));
  v_query := lower(coalesce(substring(v_rest from '\?([^#]*)'), ''));
  v_host  := regexp_replace(v_auth, ':[0-9]*$', '');

  if position('@' in v_auth) > 0 then
    return 'Pautan tidak boleh mengandungi nama pengguna atau kata laluan.';
  end if;

  if v_host = 'localhost' or v_host like '%.localhost'
     or v_host like '[%' or v_host ~ '^[0-9]+(\.[0-9]+){3}$'
     or position('.' in v_host) = 0 then
    return 'Gunakan pautan laman web awam, bukan alamat IP atau localhost.';
  end if;

  -- An API word as any label but the last (the TLD), a known API-only
  -- domain, or an API word as a path segment.
  if v_host ~ '(^|\.)(api|apis|graphql|gql|rest|rpc|webhook|webhooks|hooks|execute-api|api[-_0-9][^.]*)\.'
     or v_host ~ '(^|\.)(googleapis\.com|supabase\.co|supabase\.in|cloudfunctions\.net|firebaseio\.com)$'
     or v_path ~ '/(api|apis|graphql|gql|rest|rpc|webhook|webhooks|hooks|wp-json|api[-_0-9][^/]*)(/|$)' then
    return 'Ini kelihatan seperti pautan API. Hanya pautan borang atau laman web dibenarkan.';
  end if;

  if v_path ~ '\.(json|xml|yaml|yml|graphql)$' then
    return 'Pautan ke fail data (JSON, XML atau YAML) tidak dibenarkan.';
  end if;

  if v_query ~ '(^|&)(key|apikey|api_key|api-key|access_token|auth_token|token|secret|client_secret|password|sig|signature)=' then
    return 'Pautan mengandungi kunci atau token akses. Buang parameter tersebut dan cuba lagi.';
  end if;

  return null;
end;
$$;

-- ---------- validation + authorship ----------
create or replace function public.enforce_form_link()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_check boolean := true;
  v_problem text;
begin
  new.title       := btrim(new.title);
  new.url         := btrim(new.url);
  new.description := nullif(btrim(new.description), '');

  -- Checked only when the link changes, so archiving or deleting an older
  -- link never trips over a rule added later. (OLD kept in its own branch:
  -- it is unassigned on INSERT.)
  if tg_op = 'UPDATE' then
    v_check := new.url is distinct from old.url;
  end if;
  if v_check then
    v_problem := private.form_link_problem(new.url);
    if v_problem is not null then
      raise exception '%', v_problem using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'INSERT' then
    -- auth.uid() is null only for trusted server-side callers (service role,
    -- SQL editor), which may set the author themselves.
    if auth.uid() is not null then
      new.created_by := auth.uid();
    end if;
    new.created_by_name := coalesce(
      (select name from public.profiles where id = new.created_by),
      new.created_by_name,
      ''
    );
    new.created_at := now();
    new.updated_at := now();
    new.deleted_at := null;
    new.deleted_by := null;
  else
    -- Authorship is fixed once written.
    new.created_by      := old.created_by;
    new.created_by_name := old.created_by_name;
    new.created_at      := old.created_at;
    new.updated_at      := now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_form_link on public.form_links;
create trigger trg_form_link
  before insert or update on public.form_links
  for each row execute function public.enforce_form_link();

-- ---------- RLS ----------
alter table public.form_links enable row level security;

drop policy if exists form_links_select on public.form_links;
create policy form_links_select on public.form_links
  for select using (
    private.is_admin()
    or (deleted_at is null and private.is_active_staff())
  );

drop policy if exists form_links_insert on public.form_links;
create policy form_links_insert on public.form_links
  for insert with check (
    (private.is_admin() or private.is_active_staff())
    and created_by = auth.uid()
    and deleted_at is null
  );

drop policy if exists form_links_admin_update on public.form_links;
create policy form_links_admin_update on public.form_links
  for update using (private.is_admin()) with check (private.is_admin());

-- Staff edit / archive / unarchive their own live links. They cannot set
-- deleted_at here (WITH CHECK), so deleting goes through
-- soft_delete_form_link() below.
drop policy if exists form_links_staff_update on public.form_links;
create policy form_links_staff_update on public.form_links
  for update
  using (created_by = auth.uid() and deleted_at is null and private.is_active_staff())
  with check (created_by = auth.uid() and deleted_at is null);

grant all on public.form_links to anon, authenticated, service_role;

-- ---------- soft delete ----------
-- A plain UPDATE cannot do this for staff: Postgres also checks the updated
-- row against the SELECT policy, which hides deleted rows from them. This
-- function applies the same rule as the update policies (admin: any link,
-- staff: their own) and stamps who deleted it.
create or replace function public.soft_delete_form_link(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.form_links
  set deleted_at = now(),
      deleted_by = auth.uid()
  where id = p_id
    and deleted_at is null
    and (
      private.is_admin()
      or (created_by = auth.uid() and private.is_active_staff())
    );

  if not found then
    raise exception 'Pautan tidak dijumpai, atau anda tiada kebenaran untuk memadamnya.'
      using errcode = 'insufficient_privilege';
  end if;
end;
$$;

-- 0001's default privileges grant every new routine to anon; this one is for
-- signed-in users only.
revoke all on function public.soft_delete_form_link(uuid) from public, anon;
grant execute on function public.soft_delete_form_link(uuid) to authenticated, service_role;
