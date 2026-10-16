// Filter state for the Rekod Harian list, kept in the URL so it survives a
// visit to a record's detail page (the detail route mirrors the same schema and
// feeds it back into its Back link).

export type TrackerCategory =
  | "all"
  | "vital"
  | "ubat"
  | "makan"
  | "checklist"
  | "laporan"
  // Manual 3 monitoring tables
  | "perkumuhan"
  | "tingkahLaku"
  | "posisi"
  | "kesakitan"
  | "risikoJatuh";

export const TRACKER_CATEGORIES: { key: TrackerCategory; label: string }[] = [
  { key: "all", label: "Semua kategori" },
  { key: "vital", label: "Tanda Vital" },
  { key: "ubat", label: "Ubatan" },
  { key: "makan", label: "Makanan" },
  { key: "checklist", label: "Senarai Semak" },
  { key: "laporan", label: "Laporan Harian" },
  { key: "perkumuhan", label: "Perkumuhan" },
  { key: "tingkahLaku", label: "Tingkah Laku & Emosi" },
  { key: "posisi", label: "Penukaran Posisi" },
  { key: "kesakitan", label: "Skor Kesakitan" },
  { key: "risikoJatuh", label: "Risiko Jatuh" },
];

export interface TrackerSearch {
  pid?: string;
  sid?: string;
  category?: TrackerCategory;
  from?: string;
  to?: string;
}

const isCategory = (v: unknown): v is TrackerCategory =>
  typeof v === "string" && TRACKER_CATEGORIES.some((c) => c.key === v);

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v : undefined;

/** Route `validateSearch` — drops anything unrecognised instead of throwing. */
export function validateTrackerSearch(search: Record<string, unknown>): TrackerSearch {
  const out: TrackerSearch = {};
  const pid = str(search.pid);
  const sid = str(search.sid);
  const from = str(search.from);
  const to = str(search.to);
  if (pid && pid !== "all") out.pid = pid;
  if (sid && sid !== "all") out.sid = sid;
  if (isCategory(search.category) && search.category !== "all") {
    out.category = search.category;
  }
  if (from) out.from = from;
  if (to) out.to = to;
  return out;
}
