import { describe, expect, it } from "vitest";
import {
  BUTIRAN_KOSONG,
  butiranDariAhli,
  butiranKeBaris,
  parseKemahiran,
  parseUmur,
  tahunLahirDariUmur,
  tambahKemahiran,
  toStaffMember,
  umurDariTahunLahir,
} from "./temanion";
import type { StaffMember } from "./temanion";

const NOW = new Date(2026, 9, 14); // 14 Oct 2026

describe("age <-> birth year", () => {
  it("stores the age as a birth year and reads it back", () => {
    expect(tahunLahirDariUmur(53, NOW)).toBe(1973);
    expect(umurDariTahunLahir(1973, NOW)).toBe(53);
  });

  it("keeps counting up in later years", () => {
    expect(umurDariTahunLahir(1973, new Date(2030, 0, 1))).toBe(57);
  });

  it("has no age without a birth year", () => {
    expect(umurDariTahunLahir(null, NOW)).toBeUndefined();
    expect(umurDariTahunLahir(undefined, NOW)).toBeUndefined();
  });
});

describe("parseUmur", () => {
  it("allows the field to be empty", () => {
    expect(parseUmur("")).toEqual({ ok: true, umur: null });
    expect(parseUmur("   ")).toEqual({ ok: true, umur: null });
  });

  it("accepts a whole number in range", () => {
    expect(parseUmur("53")).toEqual({ ok: true, umur: 53 });
    expect(parseUmur(" 16 ")).toEqual({ ok: true, umur: 16 });
    expect(parseUmur("100")).toEqual({ ok: true, umur: 100 });
  });

  it("rejects anything else", () => {
    for (const bad of ["15", "101", "5.5", "abc", "-3", "53a"]) {
      expect(parseUmur(bad).ok, bad).toBe(false);
    }
  });
});

describe("parseKemahiran", () => {
  it("splits the application format into a list", () => {
    expect(
      parseKemahiran("Elderly, Use Of Wheelchair, First aid, Wound dressing"),
    ).toEqual(["Elderly", "Use Of Wheelchair", "First aid", "Wound dressing"]);
  });

  it("accepts commas, semicolons and new lines; drops blanks and repeats", () => {
    expect(parseKemahiran("a;  b\nA , , c  d")).toEqual(["a", "b", "c d"]);
    expect(parseKemahiran("")).toEqual([]);
  });

  it("tambahKemahiran appends a skill only once", () => {
    expect(tambahKemahiran("", "Rawatan Luka")).toBe("Rawatan Luka");
    expect(tambahKemahiran("Elderly", "Rawatan Luka")).toBe(
      "Elderly, Rawatan Luka",
    );
    expect(tambahKemahiran("rawatan luka", "Rawatan Luka")).toBe(
      "rawatan luka",
    );
  });
});

describe("butiranKeBaris", () => {
  it("turns a filled form into profile columns", () => {
    const r = butiranKeBaris(
      {
        umur: "53",
        jantina: "L",
        bangsa: " Melayu ",
        warganegara: "Malaysia",
        lokasi: "Klang",
        alamat: " Setapak Indah, KL ",
        kemahiran: "Elderly, First aid",
      },
      NOW,
    );
    expect(r).toEqual({
      ok: true,
      row: {
        tahun_lahir: 1973,
        jantina: "L",
        bangsa: "Melayu",
        warganegara: "Malaysia",
        lokasi: "Klang",
        alamat: "Setapak Indah, KL",
        kemahiran: ["Elderly", "First aid"],
      },
    });
  });

  it("saves blanks as null", () => {
    const r = butiranKeBaris({ ...BUTIRAN_KOSONG, warganegara: "" }, NOW);
    expect(r).toEqual({
      ok: true,
      row: {
        tahun_lahir: null,
        jantina: null,
        bangsa: null,
        warganegara: null,
        lokasi: null,
        alamat: null,
        kemahiran: null,
      },
    });
  });

  it("refuses a bad age", () => {
    const r = butiranKeBaris({ ...BUTIRAN_KOSONG, umur: "12" }, NOW);
    expect(r.ok).toBe(false);
  });
});

describe("toStaffMember / butiranDariAhli", () => {
  const row = {
    id: "u1",
    name: "Norizzuddin bin Kasim",
    email: "nori@contoh.my",
    role: "staff" as const,
    status: "active" as const,
    phone: "0123705514",
    avatar_url: null,
    specialization: null,
    experience_years: null,
    rating: null,
    notes: null,
    tahun_lahir: 1973,
    jantina: "L" as const,
    bangsa: "Melayu",
    warganegara: "Malaysia",
    lokasi: "Kuala Lumpur",
    alamat: "Setapak Indah, KL",
    kemahiran: null,
    created_at: "2026-10-01T00:00:00Z",
  };

  it("maps a profile row, with no skills as an empty list", () => {
    const m = toStaffMember(row);
    expect(m.kemahiran).toEqual([]);
    expect(m.tahunLahir).toBe(1973);
    expect(m.phone).toBe("0123705514");
    expect(m.specialization).toBeUndefined();
  });

  it("prefills the edit form and saves back the same values", () => {
    const m: StaffMember = {
      ...toStaffMember(row),
      kemahiran: ["Elderly", "First aid"],
    };
    const form = butiranDariAhli(m, NOW);
    expect(form).toEqual({
      umur: "53",
      jantina: "L",
      bangsa: "Melayu",
      warganegara: "Malaysia",
      lokasi: "Kuala Lumpur",
      alamat: "Setapak Indah, KL",
      kemahiran: "Elderly, First aid",
    });
    const back = butiranKeBaris(form, NOW);
    expect(back.ok && back.row.tahun_lahir).toBe(1973);
    expect(back.ok && back.row.kemahiran).toEqual(["Elderly", "First aid"]);
  });
});
