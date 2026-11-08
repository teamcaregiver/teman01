// Issue #12 — what the family account (penempah servis / anak) records about
// itself, on top of the name, phone and email every account has. Stored on
// public.profiles (migration 0017); only the user themself and admin can read
// it. Deliberately NOT part of the session user cached in localStorage, and
// not sent as sign-up metadata (Supabase copies that into every access token).
//
// The relationship to the care recipient is per person, so it is asked when a
// person is added (parents.relationship), not here.

export interface MaklumatPenempah {
  /** MyKad number (or passport number for non-citizens). */
  ic: string;
  /** Employer (company) name. Optional. */
  namaMajikan: string;
  /** Staff / employee ID at that employer. Optional. */
  noPekerja: string;
  /** Emergency contact person. */
  kecemasanNama: string;
  kecemasanTelefon: string;
}

export const PENEMPAH_KOSONG: MaklumatPenempah = {
  ic: "",
  namaMajikan: "",
  noPekerja: "",
  kecemasanNama: "",
  kecemasanTelefon: "",
};

/** Input limits; the same numbers are CHECK constraints in migration 0017. */
export const HAD_PENEMPAH = {
  ic: 20,
  namaMajikan: 120,
  noPekerja: 40,
  kecemasanNama: 120,
  telefon: 20,
} as const;

type PenempahColumns = {
  ic?: string | null;
  nama_majikan?: string | null;
  no_pekerja?: string | null;
  kecemasan_nama?: string | null;
  kecemasan_telefon?: string | null;
};

/** Profile row (any subset of columns) → form values. Missing columns read as blank. */
export function penempahDaripadaRow(
  r: PenempahColumns | null | undefined,
): MaklumatPenempah {
  return {
    ic: r?.ic ?? "",
    namaMajikan: r?.nama_majikan ?? "",
    noPekerja: r?.no_pekerja ?? "",
    kecemasanNama: r?.kecemasan_nama ?? "",
    kecemasanTelefon: r?.kecemasan_telefon ?? "",
  };
}

/** Form values → profile columns. Trimmed; blanks are stored as null. */
export function penempahKeRow(p: MaklumatPenempah): Required<PenempahColumns> {
  const v = (s: string) => s.trim() || null;
  return {
    ic: v(p.ic),
    nama_majikan: v(p.namaMajikan),
    no_pekerja: v(p.noPekerja),
    kecemasan_nama: v(p.kecemasanNama),
    kecemasan_telefon: v(p.kecemasanTelefon),
  };
}

/**
 * A MyKad number is 12 digits (dashes and spaces ignored). Anything with a
 * letter is taken as a passport number: 6–20 letters and digits.
 */
export function icSah(ic: string): boolean {
  const bersih = ic.replace(/[\s-]/g, "");
  if (/^\d+$/.test(bersih)) return bersih.length === 12;
  return /^[A-Za-z0-9]{6,20}$/.test(bersih);
}

/** 9–15 digits; spaces, dashes, brackets and a leading + are allowed. */
export function telefonSah(telefon: string): boolean {
  const t = telefon.trim();
  if (!/^\+?[\d\s()-]+$/.test(t)) return false;
  const digits = t.replace(/\D/g, "").length;
  return digits >= 9 && digits <= 15;
}

/**
 * First problem with the booker's details, in form order, or null when they
 * can be saved. `telefon` is the account phone (profiles.phone).
 */
export function semakPenempah(
  p: MaklumatPenempah,
  telefon: string,
): string | null {
  if (!p.ic.trim()) return "Sila isi No. Kad Pengenalan.";
  if (!icSah(p.ic))
    return "No. Kad Pengenalan mesti 12 digit (cth: 900101-14-5678), atau no. pasport yang sah.";
  if (!telefon.trim()) return "Sila isi No. Telefon.";
  if (!telefonSah(telefon)) return "No. Telefon tidak sah (cth: 012-3456789).";
  if (!p.kecemasanNama.trim()) return "Sila isi nama kontak kecemasan.";
  if (!p.kecemasanTelefon.trim())
    return "Sila isi no. telefon kontak kecemasan.";
  if (!telefonSah(p.kecemasanTelefon))
    return "No. telefon kontak kecemasan tidak sah (cth: 012-3456789).";
  return null;
}

/** True once every required booker detail is filled in (format not re-checked). */
export function penempahLengkap(
  p: MaklumatPenempah,
  telefon?: string,
): boolean {
  return !!(
    p.ic.trim() &&
    telefon?.trim() &&
    p.kecemasanNama.trim() &&
    p.kecemasanTelefon.trim()
  );
}
