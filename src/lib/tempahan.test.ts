import { describe, expect, it } from "vitest";
import type { Parent, User } from "./mock-data";
import {
  alamatServis,
  barisTempahan,
  drafKosong,
  pilihanPenempah,
  semakTempahan,
} from "./tempahan";
import type { DrafTempahan } from "./tempahan";

const valid: DrafTempahan = {
  ...drafKosong(),
  parentId: "p1",
  anakId: "a1",
  serviceTypeId: "svc-care",
  date: "2026-10-20",
  time: "09:30",
  location: "  No. 12, Jalan Damai  ",
  notes: "  ",
};

describe("drafKosong", () => {
  it("starts approved, with the family driving, and returns a fresh object", () => {
    const d = drafKosong();
    expect(d.status).toBe("confirmed");
    expect(d.transport).toBe("hantar");
    expect(d.caregiverId).toBe("");
    expect(drafKosong()).not.toBe(d);
  });
});

describe("semakTempahan", () => {
  it("accepts a complete draft", () => {
    expect(semakTempahan(valid)).toBeNull();
  });

  it("names the first missing field, in form order", () => {
    expect(semakTempahan({ ...valid, parentId: "" })).toMatch(
      /penerima servis/,
    );
    expect(semakTempahan({ ...valid, anakId: "" })).toMatch(/penempah servis/);
    expect(semakTempahan({ ...valid, serviceTypeId: "" })).toMatch(
      /jenis servis/,
    );
    expect(semakTempahan({ ...valid, date: "" })).toMatch(/tarikh dan masa/);
    expect(semakTempahan({ ...valid, time: "" })).toMatch(/tarikh dan masa/);
    expect(semakTempahan({ ...valid, location: "   " })).toMatch(/lokasi/);
  });

  it("rejects an impossible date or time", () => {
    expect(semakTempahan({ ...valid, date: "20/10/2026" })).toMatch(
      /tidak sah/,
    );
    expect(semakTempahan({ ...valid, time: "25:99" })).toMatch(/tidak sah/);
  });
});

describe("barisTempahan", () => {
  it("builds the bookings row, trimming text and nulling blanks", () => {
    expect(barisTempahan(valid)).toEqual({
      anak_id: "a1",
      parent_id: "p1",
      service_type_id: "svc-care",
      date: "2026-10-20",
      time: "09:30",
      transport: "hantar",
      location: "No. 12, Jalan Damai",
      notes: null,
      caregiver_id: null,
      status: "confirmed",
    });
  });

  it("keeps a chosen Temanion, notes and a pending status", () => {
    const row = barisTempahan({
      ...valid,
      caregiverId: "s1",
      notes: " Bawa kerusi roda ",
      status: "pending",
    });
    expect(row.caregiver_id).toBe("s1");
    expect(row.notes).toBe("Bawa kerusi roda");
    expect(row.status).toBe("pending");
  });
});

describe("alamatServis", () => {
  it("fills the address of the chosen person", () => {
    expect(alamatServis("", undefined, "No. 12, Jalan Damai")).toBe(
      "No. 12, Jalan Damai",
    );
    expect(alamatServis("   ", undefined, "No. 12, Jalan Damai")).toBe(
      "No. 12, Jalan Damai",
    );
  });

  it("follows the person when admin switches to someone else", () => {
    expect(
      alamatServis("Kuala Lumpur", "Kuala Lumpur", "No. 12, Jalan Damai"),
    ).toBe("No. 12, Jalan Damai");
  });

  it("keeps an address admin typed", () => {
    expect(
      alamatServis(
        "Hospital Klang, Wad 3",
        "Kuala Lumpur",
        "No. 12, Jalan Damai",
      ),
    ).toBe("Hospital Klang, Wad 3");
  });

  it("is blank when the new person has no address", () => {
    expect(alamatServis("Kuala Lumpur", "Kuala Lumpur", undefined)).toBe("");
  });
});

describe("pilihanPenempah", () => {
  const users: User[] = [
    {
      id: "a2",
      name: "Zainab",
      email: "z@x.my",
      role: "anak",
      status: "active",
    },
    {
      id: "a1",
      name: "Aisha Rahman",
      email: "a@x.my",
      role: "anak",
      status: "active",
    },
    {
      id: "a3",
      name: "Bukan keluarga",
      email: "b@x.my",
      role: "anak",
      status: "active",
    },
    {
      id: "s1",
      name: "Temanion",
      email: "s@x.my",
      role: "staff",
      status: "active",
    },
  ];
  const parent = { id: "p1", anakIds: ["a1", "a2", "s1"] } as Parent;

  it("lists only family accounts linked to the person, by name", () => {
    expect(pilihanPenempah(parent, users).map((u) => u.id)).toEqual([
      "a1",
      "a2",
    ]);
  });

  it("is empty before a person is chosen or when nobody is linked", () => {
    expect(pilihanPenempah(undefined, users)).toEqual([]);
    expect(pilihanPenempah({ ...parent, anakIds: [] }, users)).toEqual([]);
  });
});
