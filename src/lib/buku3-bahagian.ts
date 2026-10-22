// Buku 3 as a list of sections (issue #10). The built-in Manual 3 text from
// buku3.ts is the starting point; admin's changes from `buku3_bahagian`
// (migration 0014) are applied on top. A row with `kunci` changes a built-in
// section (null fields keep the built-in value); a row without it is a
// section admin added. The reference charts of each unit stay built in.
import type { ContentVisibility } from "@/lib/mock-data";
import type { Buku3BahagianRow } from "@/lib/supabase/types";
import {
  BUKU3_PANDUAN,
  BUKU3_PERANAN,
  BUKU3_PROFIL,
  BUKU3_SASARAN,
  BUKU3_SASARAN_PENUTUP,
  BUKU3_UNIT,
} from "./buku3";
import type { Buku3UnitId } from "./buku3";
import { escapeHtml, plainText } from "./rich-text";

export type Buku3Kunci =
  | "peranan"
  | "sasaran"
  | "profil"
  | "panduan"
  | Buku3UnitId;

/** A built-in section as the manual has it. */
export interface Buku3Asal {
  kunci: Buku3Kunci;
  tajuk: string;
  /** HTML, in the same shape the editor saves. */
  kandungan: string;
  urutan: number;
}

/** A section as shown: built-in text, or admin's version of it, or a section admin added. */
export interface BahagianBuku3 {
  /** The built-in key, or the row id of a section admin added (used in links). */
  id: string;
  kunci?: Buku3Kunci;
  /** The `buku3_bahagian` row, when there is one. */
  rowId?: string;
  tajuk: string;
  kandungan: string;
  urutan: number;
  visibility: ContentVisibility;
  /** A built-in section whose title or text admin changed. */
  diubah: boolean;
  updatedAt?: string;
  /** Attachments, as on articles; "" when none. */
  coverImage: string;
  pdfUrl: string;
  pdfName: string;
  youtubeUrl: string;
}

/** The attachment fields of a row (migration 0016); "" when none. */
function lampiran(r?: Buku3BahagianRow) {
  return {
    coverImage: r?.cover_image ?? "",
    pdfUrl: r?.pdf_url ?? "",
    pdfName: r?.pdf_name ?? "",
    youtubeUrl: r?.youtube_url ?? "",
  };
}

const senarai = (tag: "ol" | "ul", item: string[]) =>
  `<${tag}>${item.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</${tag}>`;

const arahanAm = (item: string[]) => `<h3>Arahan am</h3>${senarai("ol", item)}`;

export const BUKU3_ASAL: Buku3Asal[] = [
  {
    kunci: "peranan" as const,
    tajuk: "Peranan Utama Manual",
    kandungan: `<ol>${BUKU3_PERANAN.map(
      (p) =>
        `<li><strong>${escapeHtml(p.tajuk)}.</strong> ${escapeHtml(p.huraian)}</li>`,
    ).join("")}</ol>`,
  },
  {
    kunci: "sasaran" as const,
    tajuk: "Sasaran Pengguna Manual",
    kandungan: `${senarai("ul", BUKU3_SASARAN)}<p>${escapeHtml(BUKU3_SASARAN_PENUTUP)}</p>`,
  },
  {
    kunci: "profil" as const,
    tajuk: "Profil dan Maklumat Pesakit",
    kandungan: arahanAm(BUKU3_PROFIL.arahan),
  },
  {
    kunci: "panduan" as const,
    tajuk: "Panduan Penggunaan Manual 3",
    kandungan: senarai("ol", BUKU3_PANDUAN),
  },
  ...BUKU3_UNIT.map((u) => ({
    kunci: u.id,
    tajuk: `Unit ${u.unit}: ${u.tajuk}`,
    kandungan: arahanAm(u.arahan),
  })),
].map((b, i) => ({ ...b, urutan: (i + 1) * 10 }));

export function bahagianAsal(kunci: string): Buku3Asal | undefined {
  return BUKU3_ASAL.find((b) => b.kunci === kunci);
}

/** The reference block that stays under each built-in section, by name. */
export const CARTA_RUJUKAN: Partial<Record<Buku3Kunci, string>> = {
  profil: "Jadual maklumat pesakit",
  rutin: "Cadangan rutin harian",
  vital: "Rujukan bacaan tanda vital",
  ubat: "Kategori ubat & waktu pengambilan ubat",
  pemakanan: "Waktu makan",
  perkumuhan: "Carta Bristol & carta warna urin",
  tingkahLaku: "Indikator pemerhatian",
  posisi: "Carta penukaran posisi (Clock Turn)",
  kesakitan: "Skala muka kesakitan (Wong-Baker)",
  risikoJatuh: "Faktor risiko jatuh",
};

/** Units whose text Temanion also see, in the Panduan box of these forms. */
export const BORANG_TEMANION: Partial<Record<Buku3Kunci, string>> = {
  perkumuhan: "Perkumuhan",
  tingkahLaku: "Mood & Tingkah Laku",
  posisi: "Penukaran Posisi",
  kesakitan: "Skor Kesakitan",
  risikoJatuh: "Risiko Jatuh",
};

/**
 * Every section in book order: built-in sections with admin's changes, then
 * the sections admin added. Equal positions keep built-in sections first.
 */
export function gabungBahagian(rows: Buku3BahagianRow[]): BahagianBuku3[] {
  const byKunci = new Map(rows.filter((r) => r.kunci).map((r) => [r.kunci, r]));
  const asal: BahagianBuku3[] = BUKU3_ASAL.map((a) => {
    const r = byKunci.get(a.kunci);
    return {
      id: a.kunci,
      kunci: a.kunci,
      rowId: r?.id,
      tajuk: r?.tajuk ?? a.tajuk,
      kandungan: r?.kandungan ?? a.kandungan,
      urutan: r?.urutan ?? a.urutan,
      visibility: "published",
      diubah: r?.tajuk != null || r?.kandungan != null,
      updatedAt: r?.updated_at,
      ...lampiran(r),
    };
  });
  const tambahan: BahagianBuku3[] = rows
    .filter((r) => !r.kunci)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((r) => ({
      id: r.id,
      rowId: r.id,
      tajuk: r.tajuk ?? "",
      kandungan: r.kandungan ?? "",
      urutan: r.urutan ?? 0,
      visibility: r.visibility,
      diubah: false,
      updatedAt: r.updated_at,
      ...lampiran(r),
    }));
  // Array.prototype.sort is stable, so ties keep the order above.
  return [...asal, ...tambahan].sort((a, b) => a.urutan - b.urutan);
}

/** Where a new section goes: after the last one. */
export function urutanBaru(list: BahagianBuku3[]): number {
  return list.reduce((max, b) => Math.max(max, b.urutan), 0) + 10;
}

/**
 * Positions after moving one section up (-1) or down (+1): the new order is
 * numbered 10, 20, 30, ... Only the sections whose position changes are
 * returned, so nothing is written when the move is not possible.
 */
export function pindahBahagian(
  list: BahagianBuku3[],
  id: string,
  arah: -1 | 1,
): { bahagian: BahagianBuku3; urutan: number }[] {
  const i = list.findIndex((b) => b.id === id);
  const j = i + arah;
  if (i < 0 || j < 0 || j >= list.length) return [];
  const order = [...list];
  [order[i], order[j]] = [order[j], order[i]];
  return order.flatMap((b, k) =>
    b.urutan === (k + 1) * 10 ? [] : [{ bahagian: b, urutan: (k + 1) * 10 }],
  );
}

/** Text the Buku 3 search box looks in. */
export function teksBahagian(b: BahagianBuku3): string[] {
  return [b.tajuk, plainText(b.kandungan)];
}
