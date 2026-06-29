// Staff daily-record write helpers, backed by Supabase. Each "add report" page
// records ONE item at a time into today's still-editable record for an elderly,
// creating that record on first use. Admin & family read the same
// `tracker_records` table (via the data hooks), so entries appear after refetch.
import { supabase } from "./supabase/client";
import { isWithin24h, entryTime } from "./mock-data";
import type {
  TrackerRecord,
  VitalEntry,
  UbatanEntry,
  MakananEntry,
  TrackerStatus,
  ChecklistItemData,
} from "./mock-data";
import type { TrackerRow } from "./supabase/types";

const rank: Record<TrackerStatus, number> = { normal: 0, attention: 1, critical: 2 };

function statusFromVitals(vitals: VitalEntry[] | null | undefined): TrackerStatus {
  return (vitals ?? []).reduce<TrackerStatus>(
    (acc, e) => (rank[e.status] > rank[acc] ? e.status : acc),
    "normal",
  );
}

/**
 * Pure helper: today's still-editable record (within the 24h window) for this
 * elderly + staff, picked from an already-fetched list (e.g. `useTrackers()`).
 */
export function pickTodayRecord(
  records: TrackerRecord[],
  parentId: string,
  staffId?: string,
): TrackerRecord | undefined {
  return records
    .filter((t) => t.parentId === parentId && t.staffId === staffId && isWithin24h(t.date))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
}

async function getOrCreateToday(parentId: string, staffId: string): Promise<TrackerRow> {
  const { data, error } = await supabase
    .from("tracker_records")
    .select("*")
    .eq("parent_id", parentId)
    .eq("staff_id", staffId)
    .order("date", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const existing = data?.[0] as TrackerRow | undefined;
  if (existing && isWithin24h(existing.date)) return existing;

  const { data: created, error: insErr } = await supabase
    .from("tracker_records")
    .insert({ parent_id: parentId, staff_id: staffId, date: new Date().toISOString(), status: "normal" })
    .select("*")
    .single();
  if (insErr) throw new Error(insErr.message);
  return created as TrackerRow;
}

async function update(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from("tracker_records")
    .update({ ...patch, edited_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addVitalEntry(parentId: string, staffId: string, entry: VitalEntry) {
  const rec = await getOrCreateToday(parentId, staffId);
  const vital_entries = [...(rec.vital_entries ?? []), entry];
  await update(rec.id, { vital_entries, status: statusFromVitals(vital_entries) });
}

export async function addUbatanEntry(parentId: string, staffId: string, entry: UbatanEntry) {
  const rec = await getOrCreateToday(parentId, staffId);
  await update(rec.id, { ubatan_entries: [...(rec.ubatan_entries ?? []), entry] });
}

export async function addMakananEntry(parentId: string, staffId: string, entry: MakananEntry) {
  const rec = await getOrCreateToday(parentId, staffId);
  await update(rec.id, { makanan_entries: [...(rec.makanan_entries ?? []), entry] });
}

export async function appendAktiviti(
  parentId: string,
  staffId: string,
  staffName: string,
  text: string,
  photos: string[],
) {
  const rec = await getOrCreateToday(parentId, staffId);
  const line = text.trim() ? `[${entryTime(new Date().toISOString())}] ${text.trim()}` : "";
  const aktiviti = [rec.aktiviti, line].filter(Boolean).join("\n") || null;
  await update(rec.id, {
    aktiviti,
    aktiviti_pengesahan: aktiviti ? staffName : rec.aktiviti_pengesahan,
    gambar: photos.length ? [...(rec.gambar ?? []), ...photos] : rec.gambar,
  });
}

export async function setChecklist(parentId: string, staffId: string, checklist: ChecklistItemData[]) {
  const rec = await getOrCreateToday(parentId, staffId);
  await update(rec.id, { checklist });
}

export async function setCatatanKhas(parentId: string, staffId: string, val: string) {
  const rec = await getOrCreateToday(parentId, staffId);
  await update(rec.id, { catatan_khas: val || null });
}
