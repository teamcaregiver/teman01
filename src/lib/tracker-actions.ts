// Shared write helpers for the staff daily-record flow. Each "add report"
// page records ONE item at a time (real time) into today's still-editable
// record for an elderly, creating that record on first use. Admin & family
// read the same in-memory `trackers` store, so entries appear live.
import { trackers, isWithin24h, entryTime } from "./mock-data";
import type {
  TrackerRecord,
  VitalEntry,
  UbatanEntry,
  MakananEntry,
  TrackerStatus,
  ChecklistItemData,
} from "./mock-data";

const rank: Record<TrackerStatus, number> = {
  normal: 0,
  attention: 1,
  critical: 2,
};

// Today's still-editable record (within the 24h window) for this elderly+staff.
export function todayRecord(
  parentId: string,
  staffId?: string,
): TrackerRecord | undefined {
  return trackers
    .filter(
      (t) =>
        t.parentId === parentId && t.staffId === staffId && isWithin24h(t.date),
    )
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
}

function getOrCreate(parentId: string, staffId: string): TrackerRecord {
  let rec = todayRecord(parentId, staffId);
  if (!rec) {
    rec = {
      id: `t-${Date.now()}`,
      parentId,
      staffId,
      date: new Date().toISOString(),
      status: "normal",
    };
    trackers.unshift(rec);
  }
  return rec;
}

// Overall status follows the most severe vital reading recorded today.
function touch(rec: TrackerRecord) {
  const v = rec.vitalEntries ?? [];
  rec.status = v.reduce<TrackerStatus>(
    (acc, e) => (rank[e.status] > rank[acc] ? e.status : acc),
    "normal",
  );
  rec.editedAt = new Date().toISOString();
}

export function addVitalEntry(
  parentId: string,
  staffId: string,
  entry: VitalEntry,
) {
  const rec = getOrCreate(parentId, staffId);
  rec.vitalEntries = [...(rec.vitalEntries ?? []), entry];
  touch(rec);
}

export function addUbatanEntry(
  parentId: string,
  staffId: string,
  entry: UbatanEntry,
) {
  const rec = getOrCreate(parentId, staffId);
  rec.ubatanEntries = [...(rec.ubatanEntries ?? []), entry];
  touch(rec);
}

export function addMakananEntry(
  parentId: string,
  staffId: string,
  entry: MakananEntry,
) {
  const rec = getOrCreate(parentId, staffId);
  rec.makananEntries = [...(rec.makananEntries ?? []), entry];
  touch(rec);
}

export function appendAktiviti(
  parentId: string,
  staffId: string,
  staffName: string,
  text: string,
  photos: string[],
) {
  const rec = getOrCreate(parentId, staffId);
  const line = text.trim()
    ? `[${entryTime(new Date().toISOString())}] ${text.trim()}`
    : "";
  rec.aktiviti = [rec.aktiviti, line].filter(Boolean).join("\n") || undefined;
  if (rec.aktiviti) rec.aktivitiPengesahan = staffName;
  if (photos.length) rec.gambar = [...(rec.gambar ?? []), ...photos];
  touch(rec);
}

export function setChecklist(
  parentId: string,
  staffId: string,
  checklist: ChecklistItemData[],
) {
  const rec = getOrCreate(parentId, staffId);
  rec.checklist = checklist;
  touch(rec);
}

export function setCatatanKhas(parentId: string, staffId: string, val: string) {
  const rec = getOrCreate(parentId, staffId);
  rec.catatanKhas = val || undefined;
  touch(rec);
}
