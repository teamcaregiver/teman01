import { describe, expect, it } from "vitest";
import {
  PENEMPAH_KOSONG,
  icSah,
  penempahDaripadaRow,
  penempahKeRow,
  penempahLengkap,
  semakPenempah,
  telefonSah,
  type MaklumatPenempah,
} from "./penempah";

const lengkap: MaklumatPenempah = {
  ic: "900101-14-5678",
  namaMajikan: "",
  noPekerja: "",
  kecemasanNama: "Ahmad bin Ali",
  kecemasanTelefon: "013-9876543",
};

describe("icSah", () => {
  it("accepts a 12-digit MyKad with or without dashes and spaces", () => {
    expect(icSah("900101-14-5678")).toBe(true);
    expect(icSah("900101145678")).toBe(true);
    expect(icSah(" 900101 14 5678 ")).toBe(true);
  });
  it("rejects a MyKad with the wrong number of digits", () => {
    expect(icSah("90010114567")).toBe(false);
    expect(icSah("9001011456789")).toBe(false);
  });
  it("accepts a passport number", () => {
    expect(icSah("A12345678")).toBe(true);
  });
  it("rejects blanks, symbols and very short values", () => {
    expect(icSah("")).toBe(false);
    expect(icSah("A1#345")).toBe(false);
    expect(icSah("A123")).toBe(false);
  });
});

describe("telefonSah", () => {
  it("accepts Malaysian mobile, landline and international formats", () => {
    expect(telefonSah("012-3456789")).toBe(true);
    expect(telefonSah("011-23456789")).toBe(true);
    expect(telefonSah("03-2092 1122")).toBe(true);
    expect(telefonSah("+60 12-345 6789")).toBe(true);
    expect(telefonSah("(03) 2092 1122")).toBe(true);
  });
  it("rejects too few digits, letters and a + in the middle", () => {
    expect(telefonSah("12345")).toBe(false);
    expect(telefonSah("012-345678a")).toBe(false);
    expect(telefonSah("012+3456789")).toBe(false);
  });
});

describe("semakPenempah", () => {
  it("passes complete details; employer and staff ID are optional", () => {
    expect(semakPenempah(lengkap, "012-3456789")).toBeNull();
  });
  it("reports the first missing field in form order", () => {
    expect(semakPenempah(PENEMPAH_KOSONG, "")).toMatch(/Kad Pengenalan/);
    expect(semakPenempah(lengkap, "")).toMatch(/No\. Telefon/);
    expect(
      semakPenempah({ ...lengkap, kecemasanNama: " " }, "012-3456789"),
    ).toMatch(/nama kontak kecemasan/);
    expect(
      semakPenempah({ ...lengkap, kecemasanTelefon: "" }, "012-3456789"),
    ).toMatch(/telefon kontak kecemasan/);
  });
  it("reports a badly formed IC or phone number", () => {
    expect(semakPenempah({ ...lengkap, ic: "12345" }, "012-3456789")).toMatch(
      /12 digit/,
    );
    expect(semakPenempah(lengkap, "123")).toMatch(/tidak sah/);
    expect(
      semakPenempah({ ...lengkap, kecemasanTelefon: "abc" }, "012-3456789"),
    ).toMatch(/kecemasan tidak sah/);
  });
});

describe("penempahLengkap", () => {
  it("needs IC, phone and both emergency contact fields", () => {
    expect(penempahLengkap(lengkap, "012-3456789")).toBe(true);
    expect(penempahLengkap(lengkap, undefined)).toBe(false);
    expect(penempahLengkap({ ...lengkap, ic: "" }, "012-3456789")).toBe(false);
    expect(
      penempahLengkap({ ...lengkap, kecemasanTelefon: "" }, "012-3456789"),
    ).toBe(false);
  });
});

describe("row mapping", () => {
  it("trims values and stores blanks as null", () => {
    expect(
      penempahKeRow({
        ...lengkap,
        ic: " 900101-14-5678 ",
        namaMajikan: "  ",
        noPekerja: "E-1",
      }),
    ).toEqual({
      ic: "900101-14-5678",
      nama_majikan: null,
      no_pekerja: "E-1",
      kecemasan_nama: "Ahmad bin Ali",
      kecemasan_telefon: "013-9876543",
    });
  });
  it("reads missing or null columns as blank", () => {
    expect(penempahDaripadaRow(null)).toEqual(PENEMPAH_KOSONG);
    expect(
      penempahDaripadaRow({ ic: "900101-14-5678", nama_majikan: null }),
    ).toEqual({
      ...PENEMPAH_KOSONG,
      ic: "900101-14-5678",
    });
  });
  it("round-trips", () => {
    const full = {
      ...lengkap,
      namaMajikan: "Syarikat ABC Sdn Bhd",
      noPekerja: "E-1024",
    };
    expect(penempahDaripadaRow(penempahKeRow(full))).toEqual(full);
  });
});
