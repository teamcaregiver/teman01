// Daily checklist (Senarai Semak). A resident's own list lives in
// `parent_checklists` (migration 0012). A resident without a row uses the
// default list: admin's version in `checklist_default` (migration 0014), or
// DEFAULT_CHECKLIST until admin changes it. Once admin or the assigned
// Temanion edits a resident's list, it applies to that one resident only.
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

/** Same items, in the same order, with the same labels. */
export function sameChecklist(a: ChecklistTemplateItem[], b: ChecklistTemplateItem[]): boolean {
  return (
    a.length === b.length && a.every((it, i) => it.id === b[i].id && it.label === b[i].label)
  );
}

/**
 * The list to save from an editor: labels trimmed, plus an item typed in the
 * "add" box but not added yet (kept rather than silently dropped). Gives a
 * message instead when the list would be empty or has a blank item.
 */
export function prepareChecklist(
  draft: ChecklistTemplateItem[],
  pending: string,
): { items: ChecklistTemplateItem[] } | { error: string } {
  const label = pending.trim();
  const items = [
    ...draft.map((it) => ({ ...it, label: it.label.trim() })),
    ...(label && draft.length < CHECKLIST_MAX_ITEMS ? [{ id: newChecklistItemId(), label }] : []),
  ];
  if (items.length === 0) return { error: "Senarai mesti ada sekurang-kurangnya satu item." };
  if (items.some((it) => !it.label))
    return { error: "Ada item yang kosong. Isi atau buang item tersebut." };
  return { items };
}

/**
 * Save a resident's list. Saving the current default list unchanged removes
 * their own row, so they follow the default again.
 */
export async function saveParentChecklist(
  parentId: string,
  items: ChecklistTemplateItem[],
  defaultItems: ChecklistTemplateItem[],
): Promise<void> {
  const { error } = sameChecklist(items, defaultItems)
    ? await supabase.from("parent_checklists").delete().eq("parent_id", parentId)
    : await supabase
        .from("parent_checklists")
        .upsert({ parent_id: parentId, items }, { onConflict: "parent_id" });
  if (error) throw new Error(error.message);
}

/**
 * Save admin's default list. Saving the built-in list unchanged removes the
 * row, so the app's own list applies again.
 */
export async function saveDefaultChecklist(items: ChecklistTemplateItem[]): Promise<void> {
  const { error } = sameChecklist(items, DEFAULT_CHECKLIST)
    ? await supabase.from("checklist_default").delete().eq("id", true)
    : await supabase
        .from("checklist_default")
        .upsert({ id: true, items }, { onConflict: "id" });
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
