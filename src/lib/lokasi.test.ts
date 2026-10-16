import { describe, expect, it } from "vitest";
import {
  LOKASI,
  LOKASI_UTAMA,
  SEMUA_LOKASI,
  TIADA_LOKASI,
  lokasiOptions,
  matchesLokasi,
} from "./lokasi";

describe("LOKASI", () => {
  it("starts with Klang, Perak and Johor, as asked in the issue", () => {
    expect(LOKASI.slice(0, 3)).toEqual(["Klang", "Perak", "Johor"]);
    expect([...LOKASI_UTAMA]).toEqual(["Klang", "Perak", "Johor"]);
  });

  it("then lists every other state and federal territory once, alphabetically", () => {
    const rest = LOKASI.slice(3);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, "ms")));
    for (const negeri of [
      "Kedah",
      "Kelantan",
      "Kuala Lumpur",
      "Labuan",
      "Melaka",
      "Negeri Sembilan",
      "Pahang",
      "Perlis",
      "Pulau Pinang",
      "Putrajaya",
      "Sabah",
      "Sarawak",
      "Selangor",
      "Terengganu",
    ]) {
      expect(rest).toContain(negeri);
    }
    expect(new Set(LOKASI).size).toBe(LOKASI.length);
    expect(LOKASI).toHaveLength(17);
  });

  it("filter keys never collide with a real location", () => {
    expect(LOKASI).not.toContain(SEMUA_LOKASI);
    expect(LOKASI).not.toContain(TIADA_LOKASI);
  });
});

describe("matchesLokasi", () => {
  it("lets everything through for 'semua'", () => {
    expect(matchesLokasi("Klang", SEMUA_LOKASI)).toBe(true);
    expect(matchesLokasi(undefined, SEMUA_LOKASI)).toBe(true);
    expect(matchesLokasi(null, SEMUA_LOKASI)).toBe(true);
  });

  it("'tiada' keeps only records without a location", () => {
    expect(matchesLokasi(undefined, TIADA_LOKASI)).toBe(true);
    expect(matchesLokasi(null, TIADA_LOKASI)).toBe(true);
    expect(matchesLokasi("", TIADA_LOKASI)).toBe(true);
    expect(matchesLokasi("   ", TIADA_LOKASI)).toBe(true);
    expect(matchesLokasi("Perak", TIADA_LOKASI)).toBe(false);
  });

  it("a location matches exactly", () => {
    expect(matchesLokasi("Perak", "Perak")).toBe(true);
    expect(matchesLokasi("Johor", "Perak")).toBe(false);
    expect(matchesLokasi(undefined, "Perak")).toBe(false);
  });
});

describe("lokasiOptions", () => {
  it("is the fixed list when every saved value is on it", () => {
    expect(lokasiOptions(["Klang", undefined, "Perak", null, ""])).toEqual([
      ...LOKASI,
    ]);
  });

  it("appends saved values that are not on the list, once each and sorted", () => {
    const opts = lokasiOptions(["Setapak", "Ipoh", "Setapak ", "Klang"]);
    expect(opts.slice(0, LOKASI.length)).toEqual([...LOKASI]);
    expect(opts.slice(LOKASI.length)).toEqual(["Ipoh", "Setapak"]);
  });
});
