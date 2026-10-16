// Monitoring tables from Manual 3 / Buku 3 ("Jadual Pemantauan Pesakit oleh
// Caregiver"), units 5–9: perkumuhan, tingkah laku & emosi, penukaran posisi,
// pain score and risiko jatuh. Staff record one entry at a time, like vital /
// ubat / makanan; each entry is timestamped on save and signed (pengesahan)
// with the recording staff's name. The scales here feed the staff forms, the
// record reports and the Buku 3 reference.
import type { TrackerRecord, VitalStatus } from "@/lib/mock-data";

// ---------- time-of-day slot ----------
export type WaktuHari = "pagi" | "tengahari" | "petang" | "malam";

export const WAKTU_HARI_LABEL: Record<WaktuHari, string> = {
  pagi: "Pagi",
  tengahari: "Tengah Hari",
  petang: "Petang",
  malam: "Malam",
};

/**
 * The Manual 3 row (Pagi / Tengah hari / Petang / Malam) an entry falls in,
 * from its local time: 05:00–11:59 pagi, 12:00–13:59 tengah hari,
 * 14:00–18:59 petang, otherwise malam.
 */
export function waktuHari(iso: string): WaktuHari {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 12) return "pagi";
  if (h >= 12 && h < 14) return "tengahari";
  if (h >= 14 && h < 19) return "petang";
  return "malam";
}

// ---------- Unit 5: perkumuhan (output) ----------
export type JenisPerkumuhan = "kencing" | "najis" | "muntah";

export const JENIS_PERKUMUHAN: { key: JenisPerkumuhan; label: string }[] = [
  { key: "kencing", label: "Air Kencing" },
  { key: "najis", label: "Najis" },
  { key: "muntah", label: "Muntah" },
];

export const JENIS_PERKUMUHAN_LABEL: Record<JenisPerkumuhan, string> = {
  kencing: "Air Kencing",
  najis: "Najis",
  muntah: "Muntah",
};

export interface PerkumuhanEntry {
  masa: string; // ISO timestamp, set on save
  jenis: JenisPerkumuhan;
  kekerapan?: number; // times observed, when more than once
  bristol?: number; // najis: Bristol Stool Chart type 1–7
  warnaUrin?: number; // kencing: urine colour chart level 1–8
  keadaan?: string; // colour / texture / smell / contents
  catatan?: string;
  pengesahan?: string;
}

/** Bristol Stool Chart (Kementerian Kesihatan Malaysia, 2018). */
export const BRISTOL: { jenis: number; label: string }[] = [
  { jenis: 1, label: "Ketulan keras berasingan, seperti kacang" },
  { jenis: 2, label: "Berbentuk sosej dan berketul" },
  { jenis: 3, label: "Berbentuk sosej dengan retakan di permukaan" },
  { jenis: 4, label: "Berbentuk sosej atau ular, licin dan lembut" },
  { jenis: 5, label: "Ketulan lembut dengan tepi yang jelas" },
  { jenis: 6, label: "Cebisan lembik dan gebu" },
  { jenis: 7, label: "Berair, cair sepenuhnya" },
];

export function tafsiranBristol(jenis: number): {
  label: string;
  tahap: VitalStatus;
} {
  if (jenis <= 2)
    return {
      label: "Sembelit — tingkatkan makanan berserat dan air",
      tahap: "amaran",
    };
  if (jenis <= 4) return { label: "Normal", tahap: "normal" };
  return { label: "Cirit-birit", tahap: "amaran" };
}

/** Urine colour chart, palest (1) to darkest (8) (Kementerian Kesihatan Malaysia, 2019). */
export const WARNA_URIN: { tahap: number; warna: string }[] = [
  { tahap: 1, warna: "#FBF7D5" },
  { tahap: 2, warna: "#F8F0B0" },
  { tahap: 3, warna: "#F3E585" },
  { tahap: 4, warna: "#EDD75A" },
  { tahap: 5, warna: "#E3C33C" },
  { tahap: 6, warna: "#D4AB2C" },
  { tahap: 7, warna: "#BC9227" },
  { tahap: 8, warna: "#8F7F2C" },
];

export function tafsiranUrin(tahap: number): {
  label: string;
  tahap: VitalStatus;
} {
  if (tahap <= 3) return { label: "Hidrasi optimum", tahap: "normal" };
  if (tahap <= 6)
    return { label: "Hampir dehidrasi — perlu minum air", tahap: "amaran" };
  return { label: "Dehidrasi — beri minum air segera", tahap: "bahaya" };
}

/** Reading of one output entry: the chart result, or a flag for vomiting. */
export function tafsiranPerkumuhan(
  e: PerkumuhanEntry,
): { label: string; tahap: VitalStatus } | undefined {
  if (e.jenis === "najis" && e.bristol) return tafsiranBristol(e.bristol);
  if (e.jenis === "kencing" && e.warnaUrin) return tafsiranUrin(e.warnaUrin);
  if (e.jenis === "muntah") return { label: "Muntah", tahap: "amaran" };
  return undefined;
}

// ---------- Unit 6: tingkah laku & emosi (mood tracker) ----------
export type AspekTingkahLaku = "mood" | "interaksi" | "tingkahLaku" | "emosi";

/** Each aspect is scored 1–5; `pilihan[0]` is score 1. */
export const SKALA_TINGKAH_LAKU: {
  key: AspekTingkahLaku;
  label: string;
  pilihan: string[];
}[] = [
  {
    key: "mood",
    label: "Mood",
    pilihan: ["Sangat Ceria", "Ceria", "Neutral", "Murung", "Sangat Murung"],
  },
  {
    key: "interaksi",
    label: "Interaksi",
    pilihan: [
      "Sangat Responsif",
      "Responsif",
      "Kurang Responsif",
      "Pasif",
      "Sangat Pasif",
    ],
  },
  {
    key: "tingkahLaku",
    label: "Tingkah Laku",
    pilihan: [
      "Tenang",
      "Sedikit Gelisah",
      "Gelisah",
      "Agresif Verbal",
      "Agresif Fizikal",
    ],
  },
  {
    key: "emosi",
    label: "Emosi",
    pilihan: [
      "Sangat Tenang",
      "Tenang",
      "Resah Ringan",
      "Resah",
      "Sangat Resah / Suka Tidur",
    ],
  },
];

export interface TingkahLakuEntry {
  masa: string;
  mood?: number;
  interaksi?: number;
  tingkahLaku?: number;
  emosi?: number;
  catatan?: string;
  pengesahan?: string;
}

/** "2 · Ceria" for a recorded score, or undefined when the aspect was skipped. */
export function labelSkorTingkahLaku(
  aspek: AspekTingkahLaku,
  skor?: number,
): string | undefined {
  const skala = SKALA_TINGKAH_LAKU.find((s) => s.key === aspek);
  if (!skala || skor == null || skor < 1 || skor > 5) return undefined;
  return `${skor} · ${skala.pilihan[skor - 1]}`;
}

/** 1–3 is within the usual range; 4 needs attention; 5 is the worst state on every scale. */
export function tahapSkorTingkahLaku(skor: number): VitalStatus {
  if (skor >= 5) return "bahaya";
  if (skor === 4) return "amaran";
  return "normal";
}

// ---------- Unit 7: penukaran posisi (bedridden) ----------
export type Posisi = "terlentang" | "sisiKanan" | "sisiKiri" | "lain";

export const POSISI: { key: Posisi; label: string; en?: string }[] = [
  { key: "terlentang", label: "Baring Terlentang", en: "Recumbent" },
  { key: "sisiKanan", label: "Mengiring ke Kanan", en: "Right Lateral" },
  { key: "sisiKiri", label: "Mengiring ke Kiri", en: "Left Lateral" },
  { key: "lain", label: "Lain-lain" },
];

export interface PosisiEntry {
  masa: string;
  posisi: Posisi;
  posisiLain?: string; // when posisi is "lain"
  tujuan?: string;
  tandaLukaTekanan?: boolean; // redness / pressure sore seen while turning
  catatan?: string;
  pengesahan?: string;
}

export const SELANG_POSISI_JAM = 2;

/**
 * Clock Turn Schedule (Kementerian Kesihatan Malaysia, 2022): the position
 * for the two-hour block that contains `jam` (0–23). The same six blocks
 * repeat for the morning and the evening.
 */
export function cadanganPosisi(jam: number): Exclude<Posisi, "lain"> {
  const h = ((Math.floor(jam) % 12) + 12) % 12;
  if (h < 2) return "terlentang"; // 12 – 2
  if (h < 4) return "sisiKanan"; // 2 – 4
  if (h < 6) return "terlentang"; // 4 – 6
  if (h < 8) return "sisiKiri"; // 6 – 8
  if (h < 10) return "terlentang"; // 8 – 10
  return "sisiKanan"; // 10 – 12
}

/** The 12 turning times on the Manual 3 table, from 6:00 pagi. */
export const JADUAL_POSISI: { jam: number; label: string }[] = [
  { jam: 6, label: "6:00 pagi" },
  { jam: 8, label: "8:00 pagi" },
  { jam: 10, label: "10:00 pagi" },
  { jam: 12, label: "12:00 tengah hari" },
  { jam: 14, label: "2:00 petang" },
  { jam: 16, label: "4:00 petang" },
  { jam: 18, label: "6:00 petang" },
  { jam: 20, label: "8:00 malam" },
  { jam: 22, label: "10:00 malam" },
  { jam: 0, label: "12:00 tengah malam" },
  { jam: 2, label: "2:00 pagi" },
  { jam: 4, label: "4:00 pagi" },
];

export function labelPosisi(
  e: Pick<PosisiEntry, "posisi" | "posisiLain">,
): string {
  if (e.posisi === "lain") return e.posisiLain?.trim() || "Lain-lain";
  return POSISI.find((p) => p.key === e.posisi)?.label ?? e.posisi;
}

/** When the next turn is due: two hours after the last one. */
export function posisiSeterusnya(masa: string): Date {
  return new Date(
    new Date(masa).getTime() + SELANG_POSISI_JAM * 60 * 60 * 1000,
  );
}

// ---------- Unit 8: pain score ----------
export interface KesakitanEntry {
  masa: string;
  skor: number; // 0–10
  lokasi?: string; // where it hurts
  catatan?: string; // what makes it better / worse
  pengesahan?: string;
}

/** Wong-Baker FACES Pain Rating Scale (Wong-Baker FACES Foundation, 2016). */
export const SKALA_KESAKITAN: { skor: number; label: string; muka: string }[] =
  [
    { skor: 0, label: "Tiada kesakitan", muka: "😀" },
    { skor: 2, label: "Kesakitan ringan", muka: "🙂" },
    { skor: 4, label: "Kesakitan ringan hingga sederhana", muka: "😐" },
    { skor: 6, label: "Kesakitan sederhana", muka: "🙁" },
    { skor: 8, label: "Kesakitan teruk", muka: "😣" },
    { skor: 10, label: "Kesakitan sangat teruk", muka: "😭" },
  ];

/** Label for any 0–10 score; an odd score takes the next face up. */
export function labelKesakitan(skor: number): string {
  const s = Math.min(10, Math.max(0, Math.ceil(skor / 2) * 2));
  return SKALA_KESAKITAN.find((k) => k.skor === s)!.label;
}

export function tahapKesakitan(skor: number): VitalStatus {
  if (skor >= 7) return "bahaya";
  if (skor >= 4) return "amaran";
  return "normal";
}

// ---------- Unit 9: risiko jatuh ----------
export type FaktorRisikoJatuh =
  | "pernahJatuh"
  | "sukarBerjalan"
  | "alatBantuan"
  | "peningLemah"
  | "penglihatan"
  | "keliru"
  | "perluBantuan"
  | "ubatMengantuk";

export const FAKTOR_RISIKO_JATUH: { key: FaktorRisikoJatuh; label: string }[] =
  [
    { key: "pernahJatuh", label: "Pernah jatuh dalam tempoh 3 bulan lalu" },
    { key: "sukarBerjalan", label: "Sukar berjalan atau tidak stabil" },
    {
      key: "alatBantuan",
      label: "Menggunakan tongkat, walker atau kerusi roda",
    },
    { key: "peningLemah", label: "Mudah pening atau lemah" },
    { key: "penglihatan", label: "Penglihatan kurang jelas" },
    { key: "keliru", label: "Keliru atau mudah lupa" },
    {
      key: "perluBantuan",
      label: "Memerlukan bantuan untuk bangun atau berjalan",
    },
    {
      key: "ubatMengantuk",
      label: "Mengambil ubat yang boleh menyebabkan mengantuk atau pening",
    },
  ];

export type KejadianJatuh =
  | "tiada"
  | "hampirJatuh"
  | "jatuhTanpaKecederaan"
  | "jatuhDenganKecederaan";

export const KEJADIAN_JATUH: { key: KejadianJatuh; label: string }[] = [
  { key: "tiada", label: "Tiada kejadian" },
  { key: "hampirJatuh", label: "Hampir jatuh" },
  { key: "jatuhTanpaKecederaan", label: "Jatuh tanpa kecederaan" },
  { key: "jatuhDenganKecederaan", label: "Jatuh dengan kecederaan" },
];

export interface RisikoJatuhEntry {
  masa: string;
  faktor: FaktorRisikoJatuh[]; // the factors answered "Ya"; the rest are "Tidak"
  kejadian?: KejadianJatuh;
  catatan?: string;
  pengesahan?: string;
}

export const NOTA_RISIKO_JATUH =
  "Jadual ini panduan pemantauan risiko jatuh di rumah dan bukan penilaian Morse Fall Scale (MFS). " +
  "Penilaian MFS sebenar perlu dilakukan oleh doktor, jururawat atau pegawai kesihatan yang terlatih.";

/**
 * Manual 3 gives no score cut-offs, so this only flags: any fall is bahaya,
 * a near fall or any risk factor needs attention, none at all is normal.
 */
export function tahapRisikoJatuh(
  e: Pick<RisikoJatuhEntry, "faktor" | "kejadian">,
): VitalStatus {
  if (
    e.kejadian === "jatuhTanpaKecederaan" ||
    e.kejadian === "jatuhDenganKecederaan"
  ) {
    return "bahaya";
  }
  if (e.kejadian === "hampirJatuh" || e.faktor.length > 0) return "amaran";
  return "normal";
}

export function labelKejadianJatuh(k?: KejadianJatuh): string {
  return KEJADIAN_JATUH.find((x) => x.key === (k ?? "tiada"))!.label;
}

/** True when a day's record holds at least one Manual 3 monitoring entry. */
export function adaPemantauan(r: TrackerRecord): boolean {
  return !!(
    r.perkumuhanEntries?.length ||
    r.tingkahLakuEntries?.length ||
    r.posisiEntries?.length ||
    r.kesakitanEntries?.length ||
    r.risikoJatuhEntries?.length
  );
}

// ---------- the five categories ----------
export type KategoriPemantauan =
  | "perkumuhan"
  | "tingkahLaku"
  | "posisi"
  | "kesakitan"
  | "risikoJatuh";

export const KATEGORI_PEMANTAUAN: {
  key: KategoriPemantauan;
  label: string;
  unit: number; // Manual 3 unit number
}[] = [
  { key: "perkumuhan", label: "Perkumuhan", unit: 5 },
  { key: "tingkahLaku", label: "Tingkah Laku & Emosi", unit: 6 },
  { key: "posisi", label: "Penukaran Posisi", unit: 7 },
  { key: "kesakitan", label: "Skor Kesakitan", unit: 8 },
  { key: "risikoJatuh", label: "Risiko Jatuh", unit: 9 },
];
