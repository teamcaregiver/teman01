import { describe, expect, it } from "vitest";
import type { Booking, Parent } from "./mock-data";
import { ringkasanPenerima } from "./penerima-servis";

const parent: Parent = {
  id: "p1",
  fullName: "Puan Mariam binti Hasan",
  ic: "510304-08-5432",
  birthDate: "1951-03-04",
  gender: "P",
  address: "No. 12, Jalan Damai",
  phone: "012-3456789",
  medicalCondition: "",
  medication: "",
  emergencyContact: "",
  relationship: "Ibu",
  anakIds: ["a1", "a2"],
  staffId: "s-assigned",
};

let n = 0;
function booking(patch: Partial<Booking>): Booking {
  n += 1;
  return {
    id: `b${n}`,
    anakId: "a1",
    parentId: "p1",
    serviceTypeId: "care",
    date: "2026-07-01",
    time: "09:00",
    transport: "hantar",
    location: "No. 12, Jalan Damai",
    status: "pending",
    createdAt: "2026-06-01T00:00:00Z",
    ...patch,
  };
}

describe("ringkasanPenerima", () => {
  it("without bookings, falls back to the Temanion assigned for daily records", () => {
    expect(ringkasanPenerima(parent, [])).toEqual({
      bookingDiluluskan: undefined,
      temanionTerakhirId: "s-assigned",
      penempahId: undefined,
    });
    expect(
      ringkasanPenerima({ ...parent, staffId: undefined }, [])
        .temanionTerakhirId,
    ).toBeUndefined();
  });

  it("ignores other people's bookings", () => {
    const r = ringkasanPenerima(parent, [
      booking({
        parentId: "p2",
        status: "confirmed",
        confirmedAt: "2026-06-02T00:00:00Z",
        caregiverId: "s9",
        anakId: "a9",
      }),
    ]);
    expect(r.bookingDiluluskan).toBeUndefined();
    expect(r.temanionTerakhirId).toBe("s-assigned");
    expect(r.penempahId).toBeUndefined();
  });

  it("shows the most recently approved booking that is not cancelled", () => {
    const r = ringkasanPenerima(parent, [
      booking({
        status: "completed",
        confirmedAt: "2026-06-02T00:00:00Z",
        serviceTypeId: "companion",
      }),
      booking({
        status: "confirmed",
        confirmedAt: "2026-06-20T00:00:00Z",
        serviceTypeId: "care",
      }),
      booking({
        status: "cancelled",
        confirmedAt: "2026-06-25T00:00:00Z",
        serviceTypeId: "x",
      }),
      booking({ status: "pending" }),
    ]);
    expect(r.bookingDiluluskan).toEqual({
      tarikh: "2026-06-20T00:00:00Z",
      serviceTypeId: "care",
    });
  });

  it("the last Temanion is from a service that has started, before a scheduled one", () => {
    const r = ringkasanPenerima(parent, [
      booking({
        status: "completed",
        caregiverId: "s-old",
        date: "2026-06-01",
      }),
      booking({ status: "ongoing", caregiverId: "s-now", date: "2026-06-15" }),
      booking({
        status: "confirmed",
        caregiverId: "s-next",
        date: "2026-08-01",
      }),
      booking({
        status: "cancelled",
        caregiverId: "s-cancelled",
        date: "2026-09-01",
      }),
    ]);
    expect(r.temanionTerakhirId).toBe("s-now");
  });

  it("uses the latest scheduled Temanion when nothing has started yet", () => {
    const r = ringkasanPenerima(parent, [
      booking({ status: "confirmed", caregiverId: "s-a", date: "2026-08-01" }),
      booking({ status: "pending", caregiverId: "s-b", date: "2026-08-15" }),
      booking({ status: "confirmed", date: "2026-09-01" }), // no Temanion yet
    ]);
    expect(r.temanionTerakhirId).toBe("s-b");
  });

  it("the booker is whoever made the newest active booking", () => {
    const r = ringkasanPenerima(parent, [
      booking({ anakId: "a1", createdAt: "2026-06-01T00:00:00Z" }),
      booking({
        anakId: "a2",
        createdAt: "2026-06-10T00:00:00Z",
        status: "confirmed",
      }),
      booking({
        anakId: "a3",
        createdAt: "2026-06-20T00:00:00Z",
        status: "cancelled",
      }),
    ]);
    expect(r.penempahId).toBe("a2");
  });

  it("still names a booker when every booking was cancelled", () => {
    const r = ringkasanPenerima(parent, [
      booking({
        anakId: "a2",
        status: "cancelled",
        createdAt: "2026-06-20T00:00:00Z",
      }),
    ]);
    expect(r.penempahId).toBe("a2");
    expect(r.bookingDiluluskan).toBeUndefined();
  });
});
