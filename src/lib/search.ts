// NFD splits "é" into "e" + a combining mark; \p{M} then drops the marks.
const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Free-text search over a row: every word of the query must appear in one of
 * the fields, in any order, ignoring case and accents. An empty query matches.
 * Query words never contain spaces, so a word cannot match across two fields.
 */
export function matchesSearch(
  fields: (string | null | undefined)[],
  query: string,
): boolean {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalise(fields.filter(Boolean).join(" "));
  return words.every((w) => haystack.includes(w));
}
