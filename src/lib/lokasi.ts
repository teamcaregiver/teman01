// Locations admin can give a Temanion or a Penerima Servis, and filter both
// lists by. Klang, Perak and Johor come first (the areas served today); the
// other states and federal territories follow alphabetically. Klang is a town
// in Selangor, so Selangor stays in the list for the rest of the state.
export const LOKASI_UTAMA = ["Klang", "Perak", "Johor"] as const;

export const LOKASI: readonly string[] = [
  ...LOKASI_UTAMA,
  "Kedah",
  "Kelantan",
  "Kuala Lumpur",
  "Labuan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perlis",
  "Pulau Pinang",
  "Putrajaya",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
];

/** Filter values that are not a location themselves. */
export const SEMUA_LOKASI = "__semua__";
export const TIADA_LOKASI = "__tiada__";

/** True when `value` passes the location filter (`SEMUA_LOKASI` lets everything through). */
export function matchesLokasi(
  value: string | null | undefined,
  filter: string,
): boolean {
  if (filter === SEMUA_LOKASI) return true;
  if (filter === TIADA_LOKASI) return !value?.trim();
  return value === filter;
}

/**
 * Filter options: the fixed list, plus any other value already saved on a
 * record (e.g. set before the list existed), so no record becomes unreachable.
 */
export function lokasiOptions(values: (string | null | undefined)[]): string[] {
  const extras = [
    ...new Set(
      values
        .map((v) => v?.trim())
        .filter((v): v is string => !!v && !LOKASI.includes(v)),
    ),
  ].sort((a, b) => a.localeCompare(b, "ms"));
  return [...LOKASI, ...extras];
}
