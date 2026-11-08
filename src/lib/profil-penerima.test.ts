import { describe, expect, it } from "vitest";
import {
  BAHASA_LAIN,
  BERAT_KG,
  FIZIKAL_KOSONG,
  TINGGI_CM,
  fizikalDaripadaParent,
  fizikalKeRow,
  formatBerat,
  formatTinggi,
  joinBahasa,
  parseUkuran,
  semakFizikal,
  splitBahasa,
  umur,
} from "./profil-penerima";

describe("preferred language", () => {
  it("splits a preset and a typed language", () => {
    expect(splitBahasa("Tamil")).toEqual({ option: "Tamil", other: "" });
    expect(splitBahasa("Hakka")).toEqual({
      option: BAHASA_LAIN,
      other: "Hakka",
    });
    expect(splitBahasa(undefined)).toEqual({ option: "", other: "" });
    expect(splitBahasa("  ")).toEqual({ option: "", other: "" });
  });
  it("joins back to what is stored", () => {
    expect(joinBahasa("Mandarin", "ignored")).toBe("Mandarin");
    expect(joinBahasa(BAHASA_LAIN, "  Iban ")).toBe("Iban");
  });
});

describe("parseUkuran", () => {
  it("reads whole and decimal numbers, with a dot or a comma", () => {
    expect(parseUkuran("62", BERAT_KG)).toBe(62);
    expect(parseUkuran("62.5", BERAT_KG)).toBe(62.5);
    expect(parseUkuran("62,5", BERAT_KG)).toBe(62.5);
    expect(parseUkuran(" 158 ", TINGGI_CM)).toBe(158);
  });
  it("rounds to one decimal", () => {
    expect(parseUkuran("62.46", BERAT_KG)).toBe(62.5);
  });
  it("rejects blanks, text, negatives and values out of range", () => {
    expect(parseUkuran("", BERAT_KG)).toBeNull();
    expect(parseUkuran("abc", BERAT_KG)).toBeNull();
    expect(parseUkuran("-5", BERAT_KG)).toBeNull();
    expect(parseUkuran("9.9", BERAT_KG)).toBeNull();
    expect(parseUkuran("301", BERAT_KG)).toBeNull();
    expect(parseUkuran("1.58", TINGGI_CM)).toBeNull(); // metres, not cm
  });
  it("accepts the range ends", () => {
    expect(parseUkuran("10", BERAT_KG)).toBe(10);
    expect(parseUkuran("250", TINGGI_CM)).toBe(250);
  });
});

describe("umur", () => {
  const now = new Date("2026-11-08T10:00:00+08:00");
  it("counts whole years", () => {
    expect(umur("1951-03-04", now)).toBe(75);
    expect(umur("1951-11-09", now)).toBe(74); // birthday tomorrow
  });
  it("accepts a timestamp", () => {
    expect(umur("1951-03-04T00:00:00Z", now)).toBe(75);
  });
  it("is null for blank, invalid or future dates", () => {
    expect(umur("", now)).toBeNull();
    expect(umur(undefined, now)).toBeNull();
    expect(umur("bukan tarikh", now)).toBeNull();
    expect(umur("2030-01-01", now)).toBeNull();
  });
});

describe("format", () => {
  it("adds units and leaves unknown values blank", () => {
    expect(formatBerat(62.5)).toBe("62.5 kg");
    expect(formatTinggi(158)).toBe("158 cm");
    expect(formatBerat(undefined)).toBe("");
    expect(formatTinggi(null)).toBe("");
  });
});

describe("semakFizikal / fizikalKeRow", () => {
  const ok = {
    bahasa: "Bahasa Melayu",
    bahasaLain: "",
    berat: "62.5",
    tinggi: "158",
  };

  it("passes a complete form and converts it to columns", () => {
    expect(semakFizikal(ok)).toBeNull();
    expect(fizikalKeRow(ok)).toEqual({
      bahasa_pilihan: "Bahasa Melayu",
      berat_kg: 62.5,
      tinggi_cm: 158,
    });
  });
  it("reports the first problem", () => {
    expect(semakFizikal(FIZIKAL_KOSONG)).toMatch(/bahasa pilihan/);
    expect(semakFizikal({ ...ok, bahasa: BAHASA_LAIN })).toMatch(
      /nyatakan bahasa/,
    );
    expect(semakFizikal({ ...ok, berat: "" })).toMatch(/berat/);
    expect(semakFizikal({ ...ok, berat: "500" })).toMatch(/Berat mesti/);
    expect(semakFizikal({ ...ok, tinggi: "" })).toMatch(/tinggi/);
    expect(semakFizikal({ ...ok, tinggi: "1.6" })).toMatch(/Tinggi mesti/);
  });
  it("stores a typed language", () => {
    expect(
      fizikalKeRow({ ...ok, bahasa: BAHASA_LAIN, bahasaLain: "Hakka" })
        .bahasa_pilihan,
    ).toBe("Hakka");
  });
  it("prefills from a saved person, including one saved before issue #12", () => {
    expect(
      fizikalDaripadaParent({
        bahasaPilihan: "Iban",
        beratKg: 55,
        tinggiCm: 150.5,
      }),
    ).toEqual({
      bahasa: BAHASA_LAIN,
      bahasaLain: "Iban",
      berat: "55",
      tinggi: "150.5",
    });
    expect(fizikalDaripadaParent({})).toEqual(FIZIKAL_KOSONG);
  });
});
