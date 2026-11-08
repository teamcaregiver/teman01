// Issue #12 — the care recipient's (penerima servis) age, preferred language,
// weight and height. Language, weight and height are columns on
// public.parents (migration 0017). Age is worked out from birth_date, so it
// never goes stale.
import { differenceInYears } from "date-fns";

// ---------- preferred language ----------
// Stored as free text, like parents.relationship: these are the offered
// choices, and "Lain-lain" lets the family type any other language or dialect.
export const BAHASA_OPTIONS = [
  "Bahasa Melayu",
  "Bahasa Inggeris",
  "Mandarin",
  "Kantonis",
  "Hokkien",
  "Tamil",
] as const;

/** Sentinel for the "specify your own" choice. Never stored — the typed text is. */
export const BAHASA_LAIN = "Lain-lain";

export const HAD_BAHASA = 60;

/** Stored value → select value + free-text box, so edit forms round-trip any language. */
export function splitBahasa(stored?: string): {
  option: string;
  other: string;
} {
  const value = stored?.trim() ?? "";
  if (!value) return { option: "", other: "" };
  return (BAHASA_OPTIONS as readonly string[]).includes(value)
    ? { option: value, other: "" }
    : { option: BAHASA_LAIN, other: value };
}

/** Select value + free-text box → what gets stored. */
export function joinBahasa(option: string, other: string): string {
  return option === BAHASA_LAIN ? other.trim() : option;
}

// ---------- weight & height ----------
// Same ranges as the CHECK constraints in migration 0017.
export const BERAT_KG = { min: 10, max: 300 } as const;
export const TINGGI_CM = { min: 50, max: 250 } as const;

/**
 * A weight / height box → a number rounded to one decimal, or null when the
 * box is blank, not a number or outside the range. Accepts "62,5" too.
 */
export function parseUkuran(
  text: string,
  range: { min: number; max: number },
): number | null {
  const t = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Math.round(Number(t) * 10) / 10;
  return n >= range.min && n <= range.max ? n : null;
}

/** "62.5 kg", or "" when unknown. */
export function formatBerat(kg?: number | null): string {
  return kg == null ? "" : `${kg} kg`;
}

/** "158 cm", or "" when unknown. */
export function formatTinggi(cm?: number | null): string {
  return cm == null ? "" : `${cm} cm`;
}

// ---------- age ----------
/** Whole years since `birthDate` (yyyy-mm-dd), or null when blank, invalid or in the future. */
export function umur(
  birthDate?: string | null,
  now: Date = new Date(),
): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate.slice(0, 10));
  if (Number.isNaN(d.getTime()) || d > now) return null;
  return differenceInYears(now, d);
}

/** Today as yyyy-mm-dd in local time, for a birth date input's `max`. */
export function hariIni(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "74 tahun", or "—" when unknown. */
export function formatUmur(birthDate?: string | null): string {
  const n = umur(birthDate);
  return n == null ? "—" : `${n} tahun`;
}

// ---------- form state shared by the add / edit forms ----------
export type FizikalForm = {
  bahasa: string;
  bahasaLain: string;
  berat: string;
  tinggi: string;
};

export const FIZIKAL_KOSONG: FizikalForm = {
  bahasa: "",
  bahasaLain: "",
  berat: "",
  tinggi: "",
};

/** Prefill the edit form from a saved person. */
export function fizikalDaripadaParent(p: {
  bahasaPilihan?: string;
  beratKg?: number;
  tinggiCm?: number;
}): FizikalForm {
  const b = splitBahasa(p.bahasaPilihan);
  return {
    bahasa: b.option,
    bahasaLain: b.other,
    berat: p.beratKg == null ? "" : String(p.beratKg),
    tinggi: p.tinggiCm == null ? "" : String(p.tinggiCm),
  };
}

/** First problem with language / weight / height, or null when they can be saved. */
export function semakFizikal(f: FizikalForm): string | null {
  if (!f.bahasa) return "Sila pilih bahasa pilihan.";
  if (f.bahasa === BAHASA_LAIN && !f.bahasaLain.trim())
    return "Sila nyatakan bahasa pilihan.";
  if (!f.berat.trim()) return "Sila isi berat (kg).";
  if (parseUkuran(f.berat, BERAT_KG) == null)
    return `Berat mesti antara ${BERAT_KG.min} dan ${BERAT_KG.max} kg.`;
  if (!f.tinggi.trim()) return "Sila isi tinggi (cm).";
  if (parseUkuran(f.tinggi, TINGGI_CM) == null)
    return `Tinggi mesti antara ${TINGGI_CM.min} dan ${TINGGI_CM.max} cm.`;
  return null;
}

/** Validated form → parents columns. Call semakFizikal first. */
export function fizikalKeRow(f: FizikalForm): {
  bahasa_pilihan: string;
  berat_kg: number | null;
  tinggi_cm: number | null;
} {
  return {
    bahasa_pilihan: joinBahasa(f.bahasa, f.bahasaLain),
    berat_kg: parseUkuran(f.berat, BERAT_KG),
    tinggi_cm: parseUkuran(f.tinggi, TINGGI_CM),
  };
}
