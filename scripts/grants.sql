-- Restore the table-level privileges that Supabase normally grants automatically.
-- Paste this into the Supabase Dashboard -> SQL Editor -> Run.
-- Without these, every role (including the service_role secret key) gets
-- "permission denied for table ...", which breaks both seeding AND login.
-- Safe to re-run; RLS (enabled in 0001_init.sql) still governs row access.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all routines  in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines  to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
