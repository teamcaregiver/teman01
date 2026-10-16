import { describe, expect, it } from "vitest";
import { matchesSearch } from "./search";

const row = [
  "Puan Mariam binti Hasan",
  "Care",
  "No. 12, Jalan Damai, Klang",
  "Nurul Adibah",
  undefined,
  null,
];

describe("matchesSearch", () => {
  it("matches everything for an empty query", () => {
    expect(matchesSearch(row, "")).toBe(true);
    expect(matchesSearch(row, "   ")).toBe(true);
    expect(matchesSearch([], "")).toBe(true);
  });

  it("ignores case and extra spaces", () => {
    expect(matchesSearch(row, "MARIAM")).toBe(true);
    expect(matchesSearch(row, "  jalan   damai ")).toBe(true);
  });

  it("needs every word, in any order, across any field", () => {
    expect(matchesSearch(row, "klang nurul")).toBe(true);
    expect(matchesSearch(row, "care mariam")).toBe(true);
    expect(matchesSearch(row, "mariam johor")).toBe(false);
  });

  it("ignores accents", () => {
    expect(matchesSearch(["José Ramírez"], "jose ramirez")).toBe(true);
    expect(matchesSearch(["Jose"], "José")).toBe(true);
  });

  it("does not match a word split across two fields", () => {
    expect(matchesSearch(["Care", "Klang"], "careklang")).toBe(false);
  });
});
