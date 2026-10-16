// What the admin Penerima Servis cards show about each person's bookings:
// the latest approved booking, the Temanion who handled them last and who
// booked the service.
import type { Booking, Parent } from "@/lib/mock-data";

export interface PenerimaRingkasan {
  /** Latest approved, not cancelled booking: when it was approved and its service. */
  bookingDiluluskan?: { tarikh: string; serviceTypeId: string };
  /** Temanion (staff id) who handled this person most recently. */
  temanionTerakhirId?: string;
  /** Family account (anak id) that booked the most recent service. */
  penempahId?: string;
}

/** When the service takes place; bookings without a date fall back to when they were made. */
function serviceTime(b: Booking): number {
  const t = Date.parse(`${b.date}T${b.time || "00:00"}`);
  return Number.isNaN(t) ? Date.parse(b.createdAt) : t;
}

const started = (b: Booking) =>
  b.status === "ongoing" || b.status === "completed" ? 1 : 0;

export function ringkasanPenerima(
  parent: Parent,
  bookings: Booking[],
): PenerimaRingkasan {
  const mine = bookings.filter((b) => b.parentId === parent.id);
  const active = mine.filter((b) => b.status !== "cancelled");

  const approved = active
    .filter((b) => b.confirmedAt)
    .sort((a, b) => Date.parse(b.confirmedAt!) - Date.parse(a.confirmedAt!))[0];

  // A service that has started beats one that is only scheduled; then the
  // latest service date wins. With no booking assigned, the Temanion assigned
  // to the person for daily records is the one handling them.
  const handled = active
    .filter((b) => b.caregiverId)
    .sort(
      (a, b) => started(b) - started(a) || serviceTime(b) - serviceTime(a),
    )[0];

  const newestFirst = (a: Booking, b: Booking) =>
    Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const latest =
    [...active].sort(newestFirst)[0] ?? [...mine].sort(newestFirst)[0];

  return {
    bookingDiluluskan: approved
      ? { tarikh: approved.confirmedAt!, serviceTypeId: approved.serviceTypeId }
      : undefined,
    temanionTerakhirId: handled?.caregiverId ?? parent.staffId,
    penempahId: latest?.anakId,
  };
}
