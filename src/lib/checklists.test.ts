import { describe, expect, it, vi } from "vitest";

// checklists.ts also saves through Supabase; these tests use its pure helpers only.
vi.mock("./supabase/client", () => ({ supabase: {} }));

import {
  CHECKLIST_MAX_ITEMS,
  mergeChecklist,
  prepareChecklist,
  sameChecklist,
} from "./checklists";
import { DEFAULT_CHECKLIST } from "./mock-data";

describe("sameChecklist", () => {
  it("needs the same items, labels and order", () => {
    const copy = DEFAULT_CHECKLIST.map((c) => ({ ...c }));
    expect(sameChecklist(copy, DEFAULT_CHECKLIST)).toBe(true);
    expect(sameChecklist(copy.slice(1), DEFAULT_CHECKLIST)).toBe(false);
    expect(
      sameChecklist([copy[1], copy[0], ...copy.slice(2)], DEFAULT_CHECKLIST),
    ).toBe(false);
    expect(
      sameChecklist(
        [{ ...copy[0], label: "Mandi" }, ...copy.slice(1)],
        DEFAULT_CHECKLIST,
      ),
    ).toBe(false);
  });
});

describe("prepareChecklist", () => {
  it("trims labels and keeps an item typed but not added yet", () => {
    const r = prepareChecklist(
      [{ id: "c1", label: "  Mandi  " }],
      "  Tukar lampin ",
    );
    expect("items" in r && r.items.map((it) => it.label)).toEqual([
      "Mandi",
      "Tukar lampin",
    ]);
    expect("items" in r && r.items[0].id).toBe("c1");
  });

  it("refuses an empty list or a blank item", () => {
    expect(prepareChecklist([], "  ")).toEqual({
      error: "Senarai mesti ada sekurang-kurangnya satu item.",
    });
    expect(prepareChecklist([{ id: "c1", label: "   " }], "")).toEqual({
      error: "Ada item yang kosong. Isi atau buang item tersebut.",
    });
  });

  it("does not go past the item limit", () => {
    const full = Array.from({ length: CHECKLIST_MAX_ITEMS }, (_, i) => ({
      id: `c${i}`,
      label: `Item ${i}`,
    }));
    const r = prepareChecklist(full, "Satu lagi");
    expect("items" in r && r.items).toHaveLength(CHECKLIST_MAX_ITEMS);
  });
});

describe("mergeChecklist", () => {
  it("follows the list and keeps ticks by item id", () => {
    const merged = mergeChecklist(
      [
        { id: "c2", label: "Tukar pakaian (pagi)" },
        { id: "c-baru", label: "Sapu losyen" },
      ],
      [
        { id: "c1", label: "Mandi", done: true },
        { id: "c2", label: "Tukar pakaian", done: true },
      ],
    );
    expect(merged).toEqual([
      { id: "c2", label: "Tukar pakaian (pagi)", done: true },
      { id: "c-baru", label: "Sapu losyen", done: false },
    ]);
  });
});
