-- =====================================================================
-- Teman / Elderly-Care — content taxonomy (topics + subtopics)
-- Apply via Supabase MCP (execute_sql) or paste into Dashboard -> SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / on conflict / drop policy if exists.
-- =====================================================================

-- ---------- Tables ----------
-- Topics are global; subtopics belong to exactly one topic (FK below). Articles
-- and videos keep storing topic/subtopic as plain text NAMES (denormalized) —
-- these tables are the source of truth for the picker options, not a hard FK on
-- content, so renaming/removing a topic never orphans an existing article.
create table if not exists public.topics (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.subtopics (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references public.topics(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (topic_id, name)   -- same subtopic name allowed under different topics
);

create index if not exists idx_subtopics_topic on public.subtopics(topic_id);

-- ---------- RLS ----------
-- Mirrors the `caregivers` model: any signed-in user may read (anak browses
-- content by topic); only admins may write.
alter table public.topics    enable row level security;
alter table public.subtopics enable row level security;

drop policy if exists topics_select on public.topics;
create policy topics_select on public.topics
  for select using (auth.uid() is not null);

drop policy if exists topics_admin_all on public.topics;
create policy topics_admin_all on public.topics
  for all using (private.is_admin()) with check (private.is_admin());

drop policy if exists subtopics_select on public.subtopics;
create policy subtopics_select on public.subtopics
  for select using (auth.uid() is not null);

drop policy if exists subtopics_admin_all on public.subtopics;
create policy subtopics_admin_all on public.subtopics
  for all using (private.is_admin()) with check (private.is_admin());

-- ---------- Grants ----------
-- 0001's `alter default privileges` should cover new tables, but set them
-- explicitly so this migration is self-contained regardless of how it's applied.
grant all on public.topics    to anon, authenticated, service_role;
grant all on public.subtopics to anon, authenticated, service_role;

-- ---------- Seed (matches mock-data TOPICS / SUBTOPICS) ----------
insert into public.topics (name) values
  ('Kesihatan'), ('Pemakanan'), ('Senaman'), ('Mental')
on conflict (name) do nothing;

insert into public.subtopics (topic_id, name)
select t.id, s.name
from public.topics t
join (values
  ('Kesihatan', 'Darah Tinggi'),
  ('Kesihatan', 'Diabetes'),
  ('Kesihatan', 'Jantung'),
  ('Pemakanan', 'Diet Seimbang'),
  ('Pemakanan', 'Suplemen'),
  ('Senaman',   'Ringan'),
  ('Senaman',   'Pernafasan'),
  ('Mental',    'Demensia'),
  ('Mental',    'Kemurungan')
) as s(topic, name) on s.topic = t.name
on conflict (topic_id, name) do nothing;
