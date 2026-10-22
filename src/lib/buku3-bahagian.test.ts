import { describe, expect, it } from "vitest";
import {
  BUKU3_ASAL,
  bahagianAsal,
  gabungBahagian,
  pindahBahagian,
  teksBahagian,
  urutanBaru,
} from "./buku3-bahagian";
import { BUKU3_PERANAN, BUKU3_UNIT } from "./buku3";
import type { Buku3BahagianRow } from "./supabase/types";

const row = (r: Partial<Buku3BahagianRow>): Buku3BahagianRow => ({
  id: "r",
  kunci: null,
  tajuk: null,
  kandungan: null,
  urutan: null,
  visibility: "published",
  cover_image: null,
  pdf_url: null,
  pdf_name: null,
  youtube_url: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  updated_by: null,
  ...r,
});

describe("BUKU3_ASAL", () => {
  it("has the 4 opening sections and units 1–9, numbered 10, 20, ...", () => {
    expect(BUKU3_ASAL.map((b) => b.kunci)).toEqual([
      "peranan",
      "sasaran",
      "profil",
      "panduan",
      ...BUKU3_UNIT.map((u) => u.id),
    ]);
    expect(BUKU3_ASAL.map((b) => b.urutan)).toEqual(
      BUKU3_ASAL.map((_, i) => (i + 1) * 10),
    );
  });

  it("keeps the manual's text, escaped, as editor HTML", () => {
    const kesakitan = bahagianAsal("kesakitan")!;
    expect(kesakitan.tajuk).toBe(
      "Unit 8: Penilaian Tahap Kesakitan (Pain Score)",
    );
    expect(kesakitan.kandungan.startsWith("<h3>Arahan am</h3><ol><li>")).toBe(
      true,
    );
    const peranan = teksBahagian({
      ...bahagianAsal("peranan")!,
      id: "peranan",
      visibility: "published",
      diubah: false,
      coverImage: "",
      pdfUrl: "",
      pdfName: "",
      youtubeUrl: "",
    });
    for (const p of BUKU3_PERANAN) expect(peranan[1]).toContain(p.huraian);
    // "Alergi (Ya — nyatakan / Tidak)" etc. never break the markup.
    expect(
      BUKU3_ASAL.every(
        (b) => !/<(?!\/?(h3|ol|ul|li|p|strong)>)/.test(b.kandungan),
      ),
    ).toBe(true);
  });
});

describe("gabungBahagian", () => {
  it("is the built-in book when nothing was changed", () => {
    const list = gabungBahagian([]);
    expect(list.map((b) => b.id)).toEqual(BUKU3_ASAL.map((b) => b.kunci));
    expect(list.every((b) => !b.diubah && b.visibility === "published")).toBe(
      true,
    );
  });

  it("applies admin's title and text, keeping null fields built in", () => {
    const list = gabungBahagian([
      row({ id: "a", kunci: "vital", kandungan: "<p>Baru</p>" }),
      row({ id: "b", kunci: "ubat", urutan: 5 }),
    ]);
    const vital = list.find((b) => b.id === "vital")!;
    expect(vital).toMatchObject({
      rowId: "a",
      tajuk: bahagianAsal("vital")!.tajuk,
      kandungan: "<p>Baru</p>",
      diubah: true,
    });
    // Moving a section is not a text change.
    const ubat = list.find((b) => b.id === "ubat")!;
    expect(ubat.diubah).toBe(false);
    expect(list[0].id).toBe("ubat");
  });

  it("adds admin's sections by position, after built-in ones on a tie", () => {
    const list = gabungBahagian([
      row({
        id: "x",
        tajuk: "Akhir",
        kandungan: "<p>x</p>",
        urutan: 999,
        visibility: "draft",
      }),
      row({ id: "y", tajuk: "Tengah", kandungan: "<p>y</p>", urutan: 20 }),
    ]);
    const ids = list.map((b) => b.id);
    expect(ids.indexOf("y")).toBe(ids.indexOf("sasaran") + 1);
    expect(ids.at(-1)).toBe("x");
    const x = list.find((b) => b.id === "x")!;
    expect(x.visibility).toBe("draft");
    expect(x.kunci).toBeUndefined();
  });

  it("carries attachments on both kinds of section, and is empty without them", () => {
    const list = gabungBahagian([
      row({
        id: "a",
        kunci: "vital",
        cover_image: "https://contoh.com/k.jpg",
        youtube_url: "https://youtu.be/abcdefghijk",
      }),
      row({
        id: "z",
        tajuk: "Tambahan",
        kandungan: "<p>z</p>",
        urutan: 500,
        pdf_url: "https://contoh.com/f.pdf",
        pdf_name: "panduan.pdf",
      }),
    ]);
    const vital = list.find((b) => b.id === "vital")!;
    expect(vital).toMatchObject({
      coverImage: "https://contoh.com/k.jpg",
      youtubeUrl: "https://youtu.be/abcdefghijk",
      pdfUrl: "",
      // Attachments alone don't count as a text change.
      diubah: false,
    });
    expect(list.find((b) => b.id === "z")).toMatchObject({
      pdfUrl: "https://contoh.com/f.pdf",
      pdfName: "panduan.pdf",
      coverImage: "",
    });
    expect(list.find((b) => b.id === "ubat")).toMatchObject({
      coverImage: "",
      pdfUrl: "",
      pdfName: "",
      youtubeUrl: "",
    });
  });
});

describe("urutanBaru / pindahBahagian", () => {
  const list = gabungBahagian([
    row({ id: "t", tajuk: "Tambahan", kandungan: "<p>t</p>", urutan: 140 }),
  ]);

  it("puts a new section after the last one", () => {
    expect(urutanBaru(list)).toBe(150);
    expect(urutanBaru([])).toBe(10);
  });

  it("swaps a section with its neighbour and renumbers only what changed", () => {
    expect(pindahBahagian(list, "t", -1)).toEqual([
      { bahagian: list.find((b) => b.id === "t"), urutan: 130 },
      { bahagian: list.find((b) => b.id === "risikoJatuh"), urutan: 140 },
    ]);
  });

  it("does nothing past either end", () => {
    expect(pindahBahagian(list, "peranan", -1)).toEqual([]);
    expect(pindahBahagian(list, "t", 1)).toEqual([]);
    expect(pindahBahagian(list, "tiada", 1)).toEqual([]);
  });

  it("evens out uneven positions while moving", () => {
    const uneven = gabungBahagian([row({ kunci: "peranan", urutan: 15 })]);
    // peranan 15, sasaran 20 -> moving sasaran up gives sasaran 10, peranan 20.
    const changes = pindahBahagian(uneven, "sasaran", -1);
    expect(changes.map((c) => [c.bahagian.id, c.urutan])).toEqual([
      ["sasaran", 10],
      ["peranan", 20],
    ]);
  });
});
