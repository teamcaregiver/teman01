// Relationship of the elderly resident to the linked child (anak) account.
// Stored as free text on `parents.relationship` — these are the offered
// choices, not a DB enum, so existing records with other wording keep working.

export const RELATIONSHIP_OPTIONS = [
  "Suami",
  "Isteri",
  "Anak",
  "Datuk",
  "Nenek",
  "Keluarga",
  "Kenalan",
] as const;

/** Sentinel for the "specify your own" choice. Never stored — the typed text is. */
export const RELATIONSHIP_OTHER = "Lain-lain";

/**
 * Split a stored value into the select value + the free-text box, so the edit
 * form can round-trip a relationship that is not one of the presets.
 */
export function splitRelationship(stored?: string): {
  option: string;
  other: string;
} {
  const value = stored?.trim() ?? "";
  if (!value) return { option: "", other: "" };
  return (RELATIONSHIP_OPTIONS as readonly string[]).includes(value)
    ? { option: value, other: "" }
    : { option: RELATIONSHIP_OTHER, other: value };
}

/** Collapse the select value + free-text box back into what gets stored. */
export function joinRelationship(option: string, other: string): string {
  return option === RELATIONSHIP_OTHER ? other.trim() : option;
}
