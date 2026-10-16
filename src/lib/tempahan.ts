// Admin-only service booking (issue #9: families no longer book themselves).
import type {
  BookingStatus,
  Parent,
  TransportMode,
  User,
} from "@/lib/mock-data";

/** A new booking starts approved, or waiting for confirmation. */
export type StatusAwal = Extract<BookingStatus, "pending" | "confirmed">;

export interface DrafTempahan {
  parentId: string;
  anakId: string; // the family account booking the service (penempah)
  serviceTypeId: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  transport: TransportMode;
  location: string;
  notes: string;
  caregiverId: string; // "" = not assigned yet
  status: StatusAwal;
}

export function drafKosong(): DrafTempahan {
  return {
    parentId: "",
    anakId: "",
    serviceTypeId: "",
    date: "",
    time: "",
    transport: "hantar",
    location: "",
    notes: "",
    caregiverId: "",
    status: "confirmed",
  };
}

/**
 * The service address after switching to another person. Services usually
 * happen at home, so the address follows the person chosen — unless admin has
 * typed a different address, which is kept.
 */
export function alamatServis(
  semasa: string,
  alamatSebelum: string | undefined,
  alamatBaharu: string | undefined,
): string {
  const autoFilled = !semasa.trim() || semasa === alamatSebelum;
  return autoFilled ? (alamatBaharu ?? "") : semasa;
}

/** The first problem with a draft, or null when it can be saved. */
export function semakTempahan(d: DrafTempahan): string | null {
  if (!d.parentId) return "Sila pilih penerima servis.";
  if (!d.anakId) return "Sila pilih penempah servis.";
  if (!d.serviceTypeId) return "Sila pilih jenis servis.";
  if (!d.date || !d.time) return "Sila lengkapkan tarikh dan masa servis.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(d.date) ||
    Number.isNaN(Date.parse(`${d.date}T${d.time}`))
  ) {
    return "Tarikh atau masa tidak sah.";
  }
  if (!d.location.trim()) return "Sila isi lokasi servis.";
  return null;
}

/** The `bookings` row for a valid draft. */
export function barisTempahan(d: DrafTempahan) {
  return {
    anak_id: d.anakId,
    parent_id: d.parentId,
    service_type_id: d.serviceTypeId,
    date: d.date,
    time: d.time,
    transport: d.transport,
    location: d.location.trim(),
    notes: d.notes.trim() || null,
    caregiver_id: d.caregiverId || null,
    status: d.status,
  };
}

/** Family accounts that may book for this person: the ones linked to them. */
export function pilihanPenempah(
  parent: Parent | undefined,
  users: User[],
): User[] {
  if (!parent) return [];
  return users
    .filter((u) => u.role === "anak" && parent.anakIds.includes(u.id))
    .sort((a, b) => a.name.localeCompare(b.name, "ms"));
}
