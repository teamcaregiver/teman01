// Per-resident daily checklist (Senarai Semak), backed by `parent_checklists`
// (migration 0012). A resident without a row uses DEFAULT_CHECKLIST, so new
// residents always start from the default list. Once admin or the assigned
// Temanion edits it, the edited list applies to that one resident only.
// The day's ticks still live in tracker_records.checklist.
import { supabase } from "./supabase/client";
import { DEFAULT_CHECKLIST } from "./mock-data";
import type { ChecklistItemData } from "./mock-data";

export type ChecklistTemplateItem = { id: string; label: string };

export const CHECKLIST_LABEL_MAX = 120;
export const CHECKLIST_MAX_ITEMS = 50;

/** Fresh id for an added item; ids never change, so ticks follow a renamed item. */
export function newChecklistItemId(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isDefaultChecklist(items: ChecklistTemplateItem[]): boolean {
  return (
    items.length === DEFAULT_CHECKLIST.length &&
    items.every(
      (it, i) => it.id === DEFAULT_CHECKLIST[i].id && it.label === DEFAULT_CHECKLIST[i].label,
    )
  );
}

/**
 * Save a resident's list. Saving the default list unchanged removes their own
 * row, so they follow the default again.
 */
export async function saveParentChecklist(
  parentId: string,
  items: ChecklistTemplateItem[],
): Promise<void> {
  const { error } = isDefaultChecklist(items)
    ? await supabase.from("parent_checklists").delete().eq("parent_id", parentId)
    : await supabase
        .from("parent_checklists")
        .upsert({ parent_id: parentId, items }, { onConflict: "parent_id" });
  if (error) throw new Error(error.message);
}

/** The resident's items in list order, carrying over the ticks already made. */
export function mergeChecklist(
  items: ChecklistTemplateItem[],
  ticked?: ChecklistItemData[],
): ChecklistItemData[] {
  const done = new Map((ticked ?? []).map((c) => [c.id, c.done]));
  return items.map((it) => ({ id: it.id, label: it.label, done: done.get(it.id) ?? false }));
}
