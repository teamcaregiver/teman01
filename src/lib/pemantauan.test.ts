import { describe, expect, it } from "vitest";
import type { TrackerRecord } from "./mock-data";
import {
  BRISTOL,
  FAKTOR_RISIKO_JATUH,
  JADUAL_POSISI,
  KATEGORI_PEMANTAUAN,
  KEJADIAN_JATUH,
  SKALA_KESAKITAN,
  SKALA_TINGKAH_LAKU,
  WARNA_URIN,
  adaPemantauan,
  cadanganPosisi,
  labelKejadianJatuh,
  labelKesakitan,
  labelPosisi,
  labelSkorTingkahLaku,
  posisiSeterusnya,
  tafsiranBristol,
  tafsiranPerkumuhan,
  tafsiranUrin,
  tahapKesakitan,
  tahapRisikoJatuh,
  tahapSkorTingkahLaku,
  waktuHari,
} from "./pemantauan";

/** An ISO timestamp at a local wall-clock time. */
const at = (h: number, m = 0) => new Date(2026, 9, 14, h, m).toISOString();

describe("waktuHari — the Pagi / Tengah hari / Petang / Malam rows", () => {
  it.each([
    [0, 30, "malam"],
    [4, 59, "malam"],
    [5, 0, "pagi"],
    [11, 59, "pagi"],
    [12, 0, "tengahari"],
    [13, 59, "tengahari"],
    [14, 0, "petang"],
    [18, 59, "petang"],
    [19, 0, "malam"],
    [23, 59, "malam"],
  ] as const)("%i:%i is %s", (h, m, slot) => {
    expect(waktuHari(at(h, m))).toBe(slot);
  });
});

describe("Unit 5 — perkumuhan", () => {
  it("has the 7 Bristol types and the 8 urine colours in order", () => {
    expect(BRISTOL.map((b) => b.jenis)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(WARNA_URIN.map((w) => w.tahap)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const w of WARNA_URIN) expect(w.warna).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("reads the Bristol chart like the manual: 1–2 sembelit, 3–4 normal, 5–7 cirit-birit", () => {
    for (const j of [1, 2]) {
      expect(tafsiranBristol(j).tahap).toBe("amaran");
      expect(tafsiranBristol(j).label).toMatch(/^Sembelit/);
    }
    for (const j of [3, 4])
      expect(tafsiranBristol(j)).toEqual({ label: "Normal", tahap: "normal" });
    for (const j of [5, 6, 7])
      expect(tafsiranBristol(j)).toEqual({
        label: "Cirit-birit",
        tahap: "amaran",
      });
  });

  it("reads the urine colours: 1–3 optimum, 4–6 hampir dehidrasi, 7–8 dehidrasi", () => {
    for (const t of [1, 2, 3]) expect(tafsiranUrin(t).tahap).toBe("normal");
    for (const t of [4, 5, 6]) expect(tafsiranUrin(t).tahap).toBe("amaran");
    for (const t of [7, 8]) expect(tafsiranUrin(t).tahap).toBe("bahaya");
  });

  it("interprets each entry by its type", () => {
    const masa = at(9);
    expect(
      tafsiranPerkumuhan({ masa, jenis: "najis", bristol: 4 })?.tahap,
    ).toBe("normal");
    expect(
      tafsiranPerkumuhan({ masa, jenis: "kencing", warnaUrin: 8 })?.tahap,
    ).toBe("bahaya");
    expect(tafsiranPerkumuhan({ masa, jenis: "muntah" })).toEqual({
      label: "Muntah",
      tahap: "amaran",
    });
    // Nothing to read without the chart value.
    expect(tafsiranPerkumuhan({ masa, jenis: "najis" })).toBeUndefined();
    expect(tafsiranPerkumuhan({ masa, jenis: "kencing" })).toBeUndefined();
    // A chart value of the other type is ignored.
    expect(
      tafsiranPerkumuhan({ masa, jenis: "kencing", bristol: 1 }),
    ).toBeUndefined();
  });
});

describe("Unit 6 — tingkah laku & emosi", () => {
  it("has the four aspects with the manual's five indicators each", () => {
    expect(SKALA_TINGKAH_LAKU.map((s) => s.key)).toEqual([
      "mood",
      "interaksi",
      "tingkahLaku",
      "emosi",
    ]);
    for (const s of SKALA_TINGKAH_LAKU) expect(s.pilihan).toHaveLength(5);
    expect(SKALA_TINGKAH_LAKU[0].pilihan).toEqual([
      "Sangat Ceria",
      "Ceria",
      "Neutral",
      "Murung",
      "Sangat Murung",
    ]);
    expect(SKALA_TINGKAH_LAKU[2].pilihan[4]).toBe("Agresif Fizikal");
  });

  it("labels a score with its indicator", () => {
    expect(labelSkorTingkahLaku("mood", 2)).toBe("2 · Ceria");
    expect(labelSkorTingkahLaku("emosi", 5)).toBe(
      "5 · Sangat Resah / Suka Tidur",
    );
    expect(labelSkorTingkahLaku("mood", undefined)).toBeUndefined();
    expect(labelSkorTingkahLaku("mood", 0)).toBeUndefined();
    expect(labelSkorTingkahLaku("mood", 6)).toBeUndefined();
  });

  it("flags 4 for attention and 5 as the worst state", () => {
    expect([1, 2, 3].map(tahapSkorTingkahLaku)).toEqual([
      "normal",
      "normal",
      "normal",
    ]);
    expect(tahapSkorTingkahLaku(4)).toBe("amaran");
    expect(tahapSkorTingkahLaku(5)).toBe("bahaya");
  });
});

describe("Unit 7 — penukaran posisi (Clock Turn Schedule)", () => {
  it("follows the chart round the clock", () => {
    const expected = [
      "terlentang", // 12–2
      "terlentang",
      "sisiKanan", // 2–4
      "sisiKanan",
      "terlentang", // 4–6
      "terlentang",
      "sisiKiri", // 6–8
      "sisiKiri",
      "terlentang", // 8–10
      "terlentang",
      "sisiKanan", // 10–12
      "sisiKanan",
    ];
    for (let h = 0; h < 24; h++) {
      expect(cadanganPosisi(h), `jam ${h}`).toBe(expected[h % 12]);
    }
  });

  it("lists the 12 turning times from 6:00 pagi, two hours apart", () => {
    expect(JADUAL_POSISI).toHaveLength(12);
    expect(JADUAL_POSISI[0]).toEqual({ jam: 6, label: "6:00 pagi" });
    JADUAL_POSISI.forEach((s, i) => expect(s.jam).toBe((6 + i * 2) % 24));
    expect(JADUAL_POSISI.map((s) => cadanganPosisi(s.jam))).toEqual([
      "sisiKiri",
      "terlentang",
      "sisiKanan",
      "terlentang",
      "sisiKanan",
      "terlentang",
      "sisiKiri",
      "terlentang",
      "sisiKanan",
      "terlentang",
      "sisiKanan",
      "terlentang",
    ]);
  });

  it("names positions and the next turn", () => {
    expect(labelPosisi({ posisi: "sisiKiri" })).toBe("Mengiring ke Kiri");
    expect(labelPosisi({ posisi: "lain", posisiLain: " Separa duduk " })).toBe(
      "Separa duduk",
    );
    expect(labelPosisi({ posisi: "lain" })).toBe("Lain-lain");
    const masa = at(8, 15);
    expect(posisiSeterusnya(masa).getTime() - new Date(masa).getTime()).toBe(
      2 * 60 * 60 * 1000,
    );
  });
});

describe("Unit 8 — pain score", () => {
  it("uses the six Wong-Baker faces", () => {
    expect(SKALA_KESAKITAN.map((k) => k.skor)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it("labels every 0–10 score; an odd score takes the next face up", () => {
    expect(labelKesakitan(0)).toBe("Tiada kesakitan");
    expect(labelKesakitan(1)).toBe("Kesakitan ringan");
    expect(labelKesakitan(2)).toBe("Kesakitan ringan");
    expect(labelKesakitan(3)).toBe("Kesakitan ringan hingga sederhana");
    expect(labelKesakitan(6)).toBe("Kesakitan sederhana");
    expect(labelKesakitan(7)).toBe("Kesakitan teruk");
    expect(labelKesakitan(9)).toBe("Kesakitan sangat teruk");
    expect(labelKesakitan(10)).toBe("Kesakitan sangat teruk");
    expect(labelKesakitan(12)).toBe("Kesakitan sangat teruk");
    expect(labelKesakitan(-1)).toBe("Tiada kesakitan");
  });

  it("flags 4–6 for attention and 7–10 as severe", () => {
    expect([0, 1, 2, 3].map(tahapKesakitan)).toEqual([
      "normal",
      "normal",
      "normal",
      "normal",
    ]);
    expect([4, 5, 6].map(tahapKesakitan)).toEqual([
      "amaran",
      "amaran",
      "amaran",
    ]);
    expect([7, 8, 9, 10].map(tahapKesakitan)).toEqual([
      "bahaya",
      "bahaya",
      "bahaya",
      "bahaya",
    ]);
  });
});

describe("Unit 9 — risiko jatuh", () => {
  it("has the manual's eight risk factors", () => {
    expect(FAKTOR_RISIKO_JATUH).toHaveLength(8);
    expect(FAKTOR_RISIKO_JATUH[0].label).toBe(
      "Pernah jatuh dalam tempoh 3 bulan lalu",
    );
    expect(FAKTOR_RISIKO_JATUH[7].label).toBe(
      "Mengambil ubat yang boleh menyebabkan mengantuk atau pening",
    );
  });

  it("flags any fall as bahaya, a near fall or any factor as amaran", () => {
    expect(tahapRisikoJatuh({ faktor: [] })).toBe("normal");
    expect(tahapRisikoJatuh({ faktor: [], kejadian: "tiada" })).toBe("normal");
    expect(tahapRisikoJatuh({ faktor: ["keliru"] })).toBe("amaran");
    expect(tahapRisikoJatuh({ faktor: [], kejadian: "hampirJatuh" })).toBe(
      "amaran",
    );
    expect(
      tahapRisikoJatuh({ faktor: [], kejadian: "jatuhTanpaKecederaan" }),
    ).toBe("bahaya");
    expect(
      tahapRisikoJatuh({
        faktor: ["keliru"],
        kejadian: "jatuhDenganKecederaan",
      }),
    ).toBe("bahaya");
  });

  it("labels incidents, defaulting to none", () => {
    expect(KEJADIAN_JATUH).toHaveLength(4);
    expect(labelKejadianJatuh(undefined)).toBe("Tiada kejadian");
    expect(labelKejadianJatuh("hampirJatuh")).toBe("Hampir jatuh");
  });
});

describe("categories", () => {
  it("are Manual 3 units 5 to 9", () => {
    expect(KATEGORI_PEMANTAUAN.map((k) => k.unit)).toEqual([5, 6, 7, 8, 9]);
  });

  it("adaPemantauan spots a record with any monitoring entry", () => {
    const base: TrackerRecord = {
      id: "r",
      parentId: "p",
      staffId: "s",
      date: at(9),
      status: "normal",
    };
    expect(adaPemantauan(base)).toBe(false);
    expect(adaPemantauan({ ...base, perkumuhanEntries: [] })).toBe(false);
    expect(
      adaPemantauan({ ...base, kesakitanEntries: [{ masa: at(9), skor: 2 }] }),
    ).toBe(true);
    expect(
      adaPemantauan({
        ...base,
        risikoJatuhEntries: [{ masa: at(9), faktor: [] }],
      }),
    ).toBe(true);
  });
});
