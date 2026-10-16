import { describe, expect, it } from "vitest";
import { TRACKER_CATEGORIES, validateTrackerSearch } from "./tracker-filters";

describe("Rekod Harian category filter", () => {
  it("offers the five Manual 3 tables", () => {
    const keys = TRACKER_CATEGORIES.map((c) => c.key);
    for (const k of [
      "perkumuhan",
      "tingkahLaku",
      "posisi",
      "kesakitan",
      "risikoJatuh",
    ]) {
      expect(keys).toContain(k);
    }
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("keeps a new category in the URL and drops unknown ones", () => {
    expect(validateTrackerSearch({ category: "kesakitan" })).toEqual({
      category: "kesakitan",
    });
    expect(
      validateTrackerSearch({ category: "risikoJatuh", pid: "p1" }),
    ).toEqual({
      category: "risikoJatuh",
      pid: "p1",
    });
    expect(validateTrackerSearch({ category: "bogus" })).toEqual({});
    expect(validateTrackerSearch({ category: "all" })).toEqual({});
  });
});
