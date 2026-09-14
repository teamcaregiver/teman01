// Shared content taxonomy (topics + subtopics) for Artikel & Video, backed by
// the `topics` / `subtopics` tables (supabase/migrations/0003_taxonomy.sql).
// Articles and videos reference these rows by id (topic_id / subtopic_id,
// migration 0009). Reads are cached by React Query under TAXONOMY_QK; writes
// are admin-only at the RLS layer.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { TopicRow, SubtopicRow } from "@/lib/supabase/types";

export interface TaxonomyItem {
  id: string;
  name: string;
}

export interface Taxonomy {
  topics: TaxonomyItem[];
  /** Subtopics keyed by their topic's id. */
  subtopics: Record<string, TaxonomyItem[]>;
}

export const TAXONOMY_QK = ["taxonomy"] as const;

const EMPTY: Taxonomy = { topics: [], subtopics: {} };

async function fetchTaxonomy(): Promise<Taxonomy> {
  const [topicsRes, subsRes] = await Promise.all([
    supabase.from("topics").select("*").order("name"),
    supabase.from("subtopics").select("*").order("name"),
  ]);
  if (topicsRes.error) throw new Error(topicsRes.error.message);
  if (subsRes.error) throw new Error(subsRes.error.message);

  const topicRows = (topicsRes.data ?? []) as TopicRow[];
  const subRows = (subsRes.data ?? []) as SubtopicRow[];

  const subtopics: Record<string, TaxonomyItem[]> = {};
  for (const t of topicRows) subtopics[t.id] = [];
  for (const s of subRows) {
    subtopics[s.topic_id]?.push({ id: s.id, name: s.name });
  }
  return { topics: topicRows.map((t) => ({ id: t.id, name: t.name })), subtopics };
}

export function useTaxonomy(): Taxonomy {
  return (
    useQuery({ queryKey: TAXONOMY_QK, queryFn: fetchTaxonomy, staleTime: 30_000 })
      .data ?? EMPTY
  );
}

// Postgres unique-violation — the name already exists, which we treat as a no-op
// (caller just selects the existing row) rather than an error.
const UNIQUE_VIOLATION = "23505";

/**
 * Inserts a new topic. Resolves to the topic's id — the existing one when the
 * name is already taken — and whether it was newly created.
 */
export async function addTopic(name: string): Promise<{ id: string; created: boolean } | null> {
  const t = name.trim();
  if (!t) return null;
  const { data, error } = await supabase.from("topics").insert({ name: t }).select("id").single();
  if (!error) return { id: data.id, created: true };
  if (error.code !== UNIQUE_VIOLATION) throw new Error(error.message);

  const { data: existing, error: lookupErr } = await supabase
    .from("topics")
    .select("id")
    .eq("name", t)
    .single();
  if (lookupErr) throw new Error(lookupErr.message);
  return { id: existing.id, created: false };
}

/** Inserts a subtopic under a topic. Same return contract as addTopic. */
export async function addSubtopic(
  topicId: string,
  name: string,
): Promise<{ id: string; created: boolean } | null> {
  const s = name.trim();
  if (!topicId || !s) return null;
  const { data, error } = await supabase
    .from("subtopics")
    .insert({ topic_id: topicId, name: s })
    .select("id")
    .single();
  if (!error) return { id: data.id, created: true };
  if (error.code !== UNIQUE_VIOLATION) throw new Error(error.message);

  const { data: existing, error: lookupErr } = await supabase
    .from("subtopics")
    .select("id")
    .eq("topic_id", topicId)
    .eq("name", s)
    .single();
  if (lookupErr) throw new Error(lookupErr.message);
  return { id: existing.id, created: false };
}
