import { useSyncExternalStore } from "react";
import { TOPICS, SUBTOPICS } from "./mock-data";

// Shared, in-memory taxonomy for Artikel & Video content. Seeded from the
// mock-data constants so existing articles/videos stay valid, but admin can
// extend it at runtime. Both content pages subscribe to the same store so new
// topics/subtopics appear everywhere immediately.
export interface Taxonomy {
  topics: string[];
  subtopics: Record<string, string[]>;
}

let state: Taxonomy = {
  topics: [...TOPICS],
  subtopics: Object.fromEntries(
    Object.entries(SUBTOPICS).map(([k, v]) => [k, [...v]]),
  ),
};

const listeners = new Set<() => void>();

function setState(next: Taxonomy) {
  state = next;
  listeners.forEach((l) => l());
}

/** Adds a new topic. Returns false if blank or already exists. */
export function addTopic(name: string): boolean {
  const t = name.trim();
  if (!t || state.topics.includes(t)) return false;
  setState({
    topics: [...state.topics, t],
    subtopics: { ...state.subtopics, [t]: state.subtopics[t] ?? [] },
  });
  return true;
}

/** Adds a new subtopic under an existing topic. Returns false if invalid/duplicate. */
export function addSubtopic(topic: string, name: string): boolean {
  const s = name.trim();
  if (!topic || !s) return false;
  const existing = state.subtopics[topic] ?? [];
  if (existing.includes(s)) return false;
  setState({
    topics: state.topics.includes(topic)
      ? state.topics
      : [...state.topics, topic],
    subtopics: { ...state.subtopics, [topic]: [...existing, s] },
  });
  return true;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return state;
}

export function useTaxonomy(): Taxonomy {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
