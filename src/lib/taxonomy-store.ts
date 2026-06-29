// Shared content taxonomy (topics + subtopics) for Artikel & Video, now backed
// by the `topics` / `subtopics` tables (supabase/migrations/0003_taxonomy.sql)
// instead of in-memory state — so admin additions persist. Reads are cached by
// React Query under TAXONOMY_QK; writes are admin-only at the RLS layer.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { TopicRow, SubtopicRow } from "@/lib/supabase/types";

export interface Taxonomy {
  topics: string[];
  subtopics: Record<string, string[]>;
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

  const nameById = new Map(topicRows.map((t) => [t.id, t.name]));
  const subtopics: Record<string, string[]> = {};
  for (const t of topicRows) subtopics[t.name] = [];
  for (const s of subRows) {
    const topicName = nameById.get(s.topic_id);
    if (topicName) (subtopics[topicName] ??= []).push(s.name);
  }
  return { topics: topicRows.map((t) => t.name), subtopics };
}

export function useTaxonomy(): Taxonomy {
  return (
    useQuery({ queryKey: TAXONOMY_QK, queryFn: fetchTaxonomy, staleTime: 30_000 })
      .data ?? EMPTY
  );
}

// Postgres unique-violation — the name already exists, which we treat as a no-op
// (caller just selects the existing value) rather than an error.
const UNIQUE_VIOLATION = "23505";

/** Inserts a new topic. Returns true if created, false if it already existed. */
export async function addTopic(name: string): Promise<boolean> {
  const t = name.trim();
  if (!t) return false;
  const { error } = await supabase.from("topics").insert({ name: t });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return false;
    throw new Error(error.message);
  }
  return true;
}

/** Inserts a subtopic under an existing topic (by name). Returns true if created. */
export async function addSubtopic(topicName: string, name: string): Promise<boolean> {
  const s = name.trim();
  if (!topicName || !s) return false;

  const { data: topic, error: lookupErr } = await supabase
    .from("topics")
    .select("id")
    .eq("name", topicName)
    .maybeSingle();
  if (lookupErr) throw new Error(lookupErr.message);
  if (!topic) return false;

  const { error } = await supabase
    .from("subtopics")
    .insert({ topic_id: topic.id, name: s });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return false;
    throw new Error(error.message);
  }
  return true;
}
