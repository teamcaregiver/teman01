import { describe, expect, it } from "vitest";
import {
  BUKU3_PANDUAN,
  BUKU3_PERANAN,
  BUKU3_PROFIL,
  BUKU3_SASARAN,
  BUKU3_UNIT,
  RUJUKAN_VITAL,
  RUTIN_HARIAN,
  WAKTU_DOS,
  unitBuku3,
} from "./buku3";
import {
  statusGulaDarah,
  statusNadi,
  statusOksigen,
  statusPernafasan,
  statusSuhu,
  statusTekanan,
} from "./mock-data";

describe("Buku 3 content (Manual 3 first draft)", () => {
  it("has units 1 to 9 in order", () => {
    expect(BUKU3_UNIT.map((u) => u.unit)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(BUKU3_UNIT.map((u) => u.id)).toEqual([
      "rutin",
      "vital",
      "ubat",
      "pemakanan",
      "perkumuhan",
      "tingkahLaku",
      "posisi",
      "kesakitan",
      "risikoJatuh",
    ]);
  });

  it("carries every unit's general instructions", () => {
    const count = Object.fromEntries(
      BUKU3_UNIT.map((u) => [u.id, u.arahan.length]),
    );
    expect(count).toEqual({
      rutin: 7,
      vital: 6,
      ubat: 6,
      pemakanan: 6,
      perkumuhan: 7,
      tingkahLaku: 5,
      posisi: 6,
      kesakitan: 6,
      risikoJatuh: 7,
    });
    for (const u of BUKU3_UNIT)
      for (const a of u.arahan) expect(a.trim()).not.toBe("");
  });

  it("carries the introductory sections", () => {
    expect(BUKU3_PERANAN).toHaveLength(7);
    expect(BUKU3_SASARAN).toHaveLength(6);
    expect(BUKU3_PANDUAN).toHaveLength(7);
    expect(BUKU3_PROFIL.baris).toHaveLength(13);
    expect(RUTIN_HARIAN).toHaveLength(24);
    expect(WAKTU_DOS).toHaveLength(4);
  });

  it("finds a unit by id", () => {
    expect(unitBuku3("posisi").unit).toBe(7);
    expect(unitBuku3("risikoJatuh").tajuk).toBe("Penilaian Risiko Jatuh");
  });
});

// The book's reference table and the app's per-reading checks must agree, or
// a family would read one thing in Buku 3 and see another on the record.
describe("Unit 2 reference table matches the app's vital checks", () => {
  it("lists six parameters", () => {
    expect(RUJUKAN_VITAL.map((v) => v.parameter)).toEqual([
      "Suhu badan",
      "Tekanan darah",
      "Nadi",
      "Pernafasan",
      "Gula darah (puasa)",
      "Oksigen (SpO₂)",
    ]);
  });

  it("suhu", () => {
    expect([36.5, 37.5].map(statusSuhu)).toEqual(["normal", "normal"]);
    expect([37.6, 37.9].map(statusSuhu)).toEqual(["amaran", "amaran"]);
    expect([38.0, 39].map(statusSuhu)).toEqual(["bahaya", "bahaya"]);
  });

  it("tekanan darah", () => {
    expect(statusTekanan(118, 78)).toBe("normal");
    expect(statusTekanan(125, 78)).toBe("amaran");
    expect(statusTekanan(118, 85)).toBe("amaran");
    expect(statusTekanan(140, 85)).toBe("bahaya");
    expect(statusTekanan(118, 90)).toBe("bahaya");
    expect(statusTekanan(85, 70)).toBe("bahaya");
    expect(statusTekanan(100, 55)).toBe("bahaya");
  });

  it("nadi", () => {
    expect([60, 100].map(statusNadi)).toEqual(["normal", "normal"]);
    expect([50, 59, 101, 110].map(statusNadi)).toEqual([
      "amaran",
      "amaran",
      "amaran",
      "amaran",
    ]);
    expect([49, 111].map(statusNadi)).toEqual(["bahaya", "bahaya"]);
  });

  it("pernafasan", () => {
    expect([12, 20].map(statusPernafasan)).toEqual(["normal", "normal"]);
    expect([21, 24].map(statusPernafasan)).toEqual(["amaran", "amaran"]);
    expect([9, 25].map(statusPernafasan)).toEqual(["bahaya", "bahaya"]);
  });

  it("gula darah", () => {
    expect([3.9, 5.5].map(statusGulaDarah)).toEqual(["normal", "normal"]);
    expect([5.6, 6.9].map(statusGulaDarah)).toEqual(["amaran", "amaran"]);
    expect([3.8, 7.0].map(statusGulaDarah)).toEqual(["bahaya", "bahaya"]);
  });

  it("oksigen", () => {
    expect([95, 100].map(statusOksigen)).toEqual(["normal", "normal"]);
    expect([91, 94].map(statusOksigen)).toEqual(["amaran", "amaran"]);
    expect([90, 85].map(statusOksigen)).toEqual(["bahaya", "bahaya"]);
  });
});
