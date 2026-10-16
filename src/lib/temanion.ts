// Temanion (staff) details admin records, in the same format applications
// arrive in: name, age, phone, nationality, gender, race, location, skills.
import type { Gender, ProfileRow } from "@/lib/supabase/types";
import type { User } from "@/lib/mock-data";

/** A staff/admin account plus everything admin records about a Temanion. */
export type StaffMember = User & {
  specialization?: string;
  experienceYears?: number;
  rating?: number;
  notes?: string;
  tahunLahir?: number;
  jantina?: Gender;
  bangsa?: string;
  warganegara?: string;
  lokasi?: string;
  alamat?: string;
  kemahiran: string[];
  createdAt?: string;
};

// One literal, so supabase-js can type the selected row.
export const STAFF_COLUMNS =
  "id,name,email,role,status,phone,avatar_url,specialization,experience_years,rating,notes,tahun_lahir,jantina,bangsa,warganegara,lokasi,alamat,kemahiran,created_at";

type StaffRow = Pick<
  ProfileRow,
  | "id"
  | "name"
  | "email"
  | "role"
  | "status"
  | "phone"
  | "avatar_url"
  | "specialization"
  | "experience_years"
  | "rating"
  | "notes"
  | "tahun_lahir"
  | "jantina"
  | "bangsa"
  | "warganegara"
  | "lokasi"
  | "alamat"
  | "kemahiran"
  | "created_at"
>;

export function toStaffMember(p: StaffRow): StaffMember {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    status: p.status,
    phone: p.phone ?? undefined,
    avatar: p.avatar_url ?? undefined,
    specialization: p.specialization ?? undefined,
    experienceYears: p.experience_years ?? undefined,
    rating: p.rating ?? undefined,
    notes: p.notes ?? undefined,
    tahunLahir: p.tahun_lahir ?? undefined,
    jantina: p.jantina ?? undefined,
    bangsa: p.bangsa ?? undefined,
    warganegara: p.warganegara ?? undefined,
    lokasi: p.lokasi ?? undefined,
    alamat: p.alamat ?? undefined,
    kemahiran: p.kemahiran ?? [],
    createdAt: p.created_at,
  };
}

export const JANTINA_LABEL: Record<Gender, string> = {
  L: "Lelaki",
  P: "Perempuan",
};

export const BANGSA_OPTIONS = [
  "Melayu",
  "Cina",
  "India",
  "Bumiputera Sabah",
  "Bumiputera Sarawak",
  "Orang Asli",
  "Lain-lain",
];

export const WARGANEGARA_OPTIONS = ["Malaysia", "Bukan Warganegara"];

/** Common skills offered as one-tap additions on the form. */
export const KEMAHIRAN_CADANGAN = [
  "Penjagaan Warga Emas",
  "Penggunaan Kerusi Roda",
  "Pertolongan Cemas",
  "Rawatan Luka",
];

export const UMUR_MIN = 16;
export const UMUR_MAX = 100;

// Age is saved as a birth year so it keeps counting up by itself.
export function tahunLahirDariUmur(
  umur: number,
  now: Date = new Date(),
): number {
  return now.getFullYear() - umur;
}

export function umurDariTahunLahir(
  tahunLahir: number | null | undefined,
  now: Date = new Date(),
): number | undefined {
  return tahunLahir == null ? undefined : now.getFullYear() - tahunLahir;
}

/** The age field: empty is allowed; anything else must be a whole number in range. */
export function parseUmur(
  input: string,
): { ok: true; umur: number | null } | { ok: false; message: string } {
  const s = input.trim();
  if (s === "") return { ok: true, umur: null };
  if (!/^\d+$/.test(s))
    return { ok: false, message: "Umur mesti nombor bulat." };
  const umur = Number(s);
  if (umur < UMUR_MIN || umur > UMUR_MAX) {
    return {
      ok: false,
      message: `Umur mesti antara ${UMUR_MIN} dan ${UMUR_MAX} tahun.`,
    };
  }
  return { ok: true, umur };
}

/**
 * Skills typed as "Elderly, First aid; Wound dressing" (comma, semicolon or
 * new line separated) -> a clean list without blanks or repeats (case-insensitive).
 */
export function parseKemahiran(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[,;\n]/)) {
    const s = raw.trim().replace(/\s+/g, " ");
    const key = s.toLowerCase();
    if (!s || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

// ---------- form <-> row ----------
/** The Temanion detail fields as typed into the add / edit forms. */
export interface ButiranTemanionForm {
  umur: string;
  jantina: "" | Gender;
  bangsa: string;
  warganegara: string;
  lokasi: string;
  alamat: string;
  kemahiran: string; // comma separated
}

export const BUTIRAN_KOSONG: ButiranTemanionForm = {
  umur: "",
  jantina: "",
  bangsa: "",
  warganegara: "Malaysia",
  lokasi: "",
  alamat: "",
  kemahiran: "",
};

export function butiranDariAhli(
  m: StaffMember,
  now: Date = new Date(),
): ButiranTemanionForm {
  const umur = umurDariTahunLahir(m.tahunLahir, now);
  return {
    umur: umur != null ? String(umur) : "",
    jantina: m.jantina ?? "",
    bangsa: m.bangsa ?? "",
    warganegara: m.warganegara ?? "",
    lokasi: m.lokasi ?? "",
    alamat: m.alamat ?? "",
    kemahiran: m.kemahiran.join(", "),
  };
}

export type ButiranTemanionRow = Pick<
  ProfileRow,
  | "tahun_lahir"
  | "jantina"
  | "bangsa"
  | "warganegara"
  | "lokasi"
  | "alamat"
  | "kemahiran"
>;

/** Validates the form and turns it into the profile columns (blank -> null). */
export function butiranKeBaris(
  f: ButiranTemanionForm,
  now: Date = new Date(),
): { ok: true; row: ButiranTemanionRow } | { ok: false; message: string } {
  const umur = parseUmur(f.umur);
  if (!umur.ok) return umur;
  const kemahiran = parseKemahiran(f.kemahiran);
  const text = (s: string) => s.trim().replace(/\s+/g, " ") || null;
  return {
    ok: true,
    row: {
      tahun_lahir:
        umur.umur == null ? null : tahunLahirDariUmur(umur.umur, now),
      jantina: f.jantina || null,
      bangsa: text(f.bangsa),
      warganegara: text(f.warganegara),
      lokasi: text(f.lokasi),
      alamat: f.alamat.trim() || null,
      kemahiran: kemahiran.length ? kemahiran : null,
    },
  };
}

/** Adds one skill to the typed list, unless it is already there. */
export function tambahKemahiran(input: string, skill: string): string {
  const list = parseKemahiran(input);
  if (list.some((s) => s.toLowerCase() === skill.toLowerCase()))
    return list.join(", ");
  return [...list, skill].join(", ");
}
