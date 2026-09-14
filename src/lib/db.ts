// Supabase read layer. Each function returns the SAME camelCase shapes the UI
// already uses (the interfaces in mock-data.ts), so route components only swap
// their data source — not their rendering. RLS scopes every result to the
// logged-in user automatically.
import { supabase } from "@/lib/supabase/client";
import type {
  Article,
  Booking,
  BookingStatus,
  Caregiver,
  Medication,
  Parent,
  ServiceTypeOption,
  TrackerRecord,
  User,
  Video,
} from "@/lib/mock-data";
import type {
  ArticleRow,
  BookingRow,
  CaregiverRow,
  MedicationRow,
  ParentRow,
  ProfileRow,
  ServiceTypeRow,
  TrackerRow,
  VideoRow,
} from "@/lib/supabase/types";

/** Topic/subtopic names embedded next to the foreign keys (migration 0009). */
type TaxonomyNames = {
  topic: { name: string } | null;
  subtopic: { name: string } | null;
};

const ARTICLE_SELECT =
  "*, topic:topics!articles_topic_id_fkey(name), subtopic:subtopics!articles_subtopic_fkey(name)";
const VIDEO_SELECT =
  "*, topic:topics!videos_topic_id_fkey(name), subtopic:subtopics!videos_subtopic_fkey(name)";

// ---------- mappers (snake_case row -> camelCase UI shape) ----------
const toUser = (r: ProfileRow): User => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role,
  status: r.status,
  phone: r.phone ?? undefined,
  avatar: r.avatar_url ?? undefined,
});

const toParent = (r: ParentRow, anakIds: string[]): Parent => ({
  id: r.id,
  fullName: r.full_name,
  ic: r.ic,
  birthDate: r.birth_date ?? "",
  gender: r.gender,
  address: r.address ?? "",
  phone: r.phone ?? "",
  medicalCondition: r.medical_condition ?? "",
  medication: r.medication ?? "",
  emergencyContact: r.emergency_contact ?? "",
  relationship: r.relationship ?? "",
  anakIds,
  staffId: r.staff_id ?? undefined,
  jenisDarah: r.jenis_darah ?? undefined,
  alahan: r.alahan ?? undefined,
  namaDoktor: r.nama_doktor ?? undefined,
  telDoktor: r.tel_doktor ?? undefined,
  hospitalRujukan: r.hospital_rujukan ?? undefined,
  noInsurans: r.no_insurans ?? undefined,
  statusMobiliti: r.status_mobiliti ?? undefined,
  statusKognitif: r.status_kognitif ?? undefined,
  sekatanPemakanan: r.sekatan_pemakanan ?? undefined,
  archivedAt: r.archived_at ?? undefined,
});

const toMedication = (r: MedicationRow): Medication => ({
  id: r.id,
  parentId: r.parent_id,
  namaUbat: r.nama_ubat,
  dos: r.dos ?? "",
  caraPengambilan: r.cara_pengambilan ?? "",
  kekerapan: r.kekerapan ?? undefined,
  catatan: r.catatan ?? undefined,
  prn: r.prn ?? undefined,
  prnType: (r.prn_type as Medication["prnType"]) ?? undefined,
});

const toCaregiver = (r: CaregiverRow): Caregiver => ({
  id: r.id,
  name: r.name,
  phone: r.phone ?? "",
  avatar: r.avatar_url ?? undefined,
  status: r.status,
  specialization: r.specialization ?? undefined,
  experienceYears: r.experience_years ?? undefined,
  rating: r.rating ?? undefined,
  notes: r.notes ?? undefined,
});

const toServiceType = (r: ServiceTypeRow): ServiceTypeOption => ({
  id: r.id,
  code: r.code,
  name: r.name,
  description: r.description ?? "",
});

const toTracker = (r: TrackerRow): TrackerRecord => ({
  id: r.id,
  parentId: r.parent_id,
  staffId: r.staff_id ?? "",
  date: r.date,
  status: r.status,
  vitalEntries: r.vital_entries ?? undefined,
  ubatanEntries: r.ubatan_entries ?? undefined,
  makananEntries: r.makanan_entries ?? undefined,
  aktiviti: r.aktiviti ?? undefined,
  aktivitiPengesahan: r.aktiviti_pengesahan ?? undefined,
  gambar: r.gambar ?? undefined,
  checklist: r.checklist ?? undefined,
  catatanKhas: r.catatan_khas ?? undefined,
  editedByAdmin: r.edited_by_admin ?? undefined,
  editedAt: r.edited_at ?? undefined,
  editAllowed: r.edit_allowed ?? undefined,
});

const toBooking = (r: BookingRow): Booking => ({
  id: r.id,
  anakId: r.anak_id,
  parentId: r.parent_id ?? undefined,
  serviceTypeId: r.service_type_id,
  date: r.date ?? "",
  time: r.time ?? "",
  transport: r.transport ?? "sendiri",
  location: r.location ?? "",
  notes: r.notes ?? undefined,
  status: r.status,
  createdAt: r.created_at,
  caregiverId: r.caregiver_id ?? undefined,
  price: r.price ?? undefined,
  paymentStatus: r.payment_status ?? undefined,
  paymentNotes: r.payment_notes ?? undefined,
});

const toArticle = (r: ArticleRow & TaxonomyNames): Article => ({
  id: r.id,
  title: r.title,
  topicId: r.topic_id ?? undefined,
  subtopicId: r.subtopic_id ?? undefined,
  topic: r.topic?.name ?? "",
  subtopic: r.subtopic?.name ?? "",
  coverImage: r.cover_image ?? "",
  body: r.body ?? "",
  pdfUrl: r.pdf_url ?? undefined,
  pdfName: r.pdf_name ?? undefined,
  youtubeUrl: r.youtube_url ?? undefined,
  visibility: r.visibility,
  views: r.views ?? 0,
  createdAt: r.created_at,
});

const toVideo = (r: VideoRow & TaxonomyNames): Video => ({
  id: r.id,
  title: r.title,
  topicId: r.topic_id ?? undefined,
  subtopicId: r.subtopic_id ?? undefined,
  topic: r.topic?.name ?? "",
  subtopic: r.subtopic?.name ?? "",
  url: r.url ?? "",
  description: r.description ?? "",
  pdfUrl: r.pdf_url ?? undefined,
  pdfName: r.pdf_name ?? undefined,
  visibility: r.visibility,
  views: r.views ?? 0,
  createdAt: r.created_at,
});

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

// ---------- profiles / users ----------
export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  return unwrap<ProfileRow[]>(data, error).map(toUser);
}

export async function fetchUsersByRole(role: User["role"]): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", role)
    .order("created_at", { ascending: true });
  return unwrap<ProfileRow[]>(data, error).map(toUser);
}

// ---------- parents (assembles anakIds from parent_anak) ----------
async function anakIdMap(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase.from("parent_anak").select("*");
  const rows = unwrap<{ parent_id: string; anak_id: string }[]>(data, error);
  const map: Record<string, string[]> = {};
  for (const r of rows) (map[r.parent_id] ??= []).push(r.anak_id);
  return map;
}

/** Active residents only — archived ones are excluded from every list. */
export async function fetchParents(): Promise<Parent[]> {
  const [{ data, error }, links] = await Promise.all([
    supabase.from("parents").select("*").is("archived_at", null).order("full_name"),
    anakIdMap(),
  ]);
  return unwrap<ParentRow[]>(data, error).map((r) => toParent(r, links[r.id] ?? []));
}

/** Archived residents, newest archive first. Their history stays intact. */
export async function fetchArchivedParents(): Promise<Parent[]> {
  const [{ data, error }, links] = await Promise.all([
    supabase
      .from("parents")
      .select("*")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false }),
    anakIdMap(),
  ]);
  return unwrap<ParentRow[]>(data, error).map((r) => toParent(r, links[r.id] ?? []));
}

export async function fetchParentById(id: string): Promise<Parent | null> {
  const [{ data, error }, links] = await Promise.all([
    supabase.from("parents").select("*").eq("id", id).maybeSingle(),
    anakIdMap(),
  ]);
  if (error) throw new Error(error.message);
  return data ? toParent(data as ParentRow, links[id] ?? []) : null;
}

// ---------- medications ----------
export async function fetchMedications(): Promise<Medication[]> {
  const { data, error } = await supabase.from("medications").select("*");
  return unwrap<MedicationRow[]>(data, error).map(toMedication);
}

export async function fetchMedicationsForParent(parentId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("parent_id", parentId);
  return unwrap<MedicationRow[]>(data, error).map(toMedication);
}

// ---------- caregivers (staff accounts) ----------
/**
 * Staff accounts as caregiver cards. Goes through the list_caregivers() RPC
 * because profiles RLS hides other users: admins get every staff account,
 * anak only the staff assigned to their own bookings.
 */
export async function fetchCaregivers(): Promise<Caregiver[]> {
  const { data, error } = await supabase.rpc("list_caregivers");
  return unwrap<CaregiverRow[]>(data, error).map(toCaregiver);
}

// ---------- service types ----------
export async function fetchServiceTypes(): Promise<ServiceTypeOption[]> {
  const { data, error } = await supabase.from("service_types").select("*").order("name");
  return unwrap<ServiceTypeRow[]>(data, error).map(toServiceType);
}

// ---------- tracker records ----------
export async function fetchTrackers(): Promise<TrackerRecord[]> {
  const { data, error } = await supabase
    .from("tracker_records")
    .select("*")
    .order("date", { ascending: false });
  return unwrap<TrackerRow[]>(data, error).map(toTracker);
}

export async function fetchTrackersForParent(parentId: string): Promise<TrackerRecord[]> {
  const { data, error } = await supabase
    .from("tracker_records")
    .select("*")
    .eq("parent_id", parentId)
    .order("date", { ascending: false });
  return unwrap<TrackerRow[]>(data, error).map(toTracker);
}

export async function fetchTrackerById(id: string): Promise<TrackerRecord | null> {
  const { data, error } = await supabase
    .from("tracker_records")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toTracker(data as TrackerRow) : null;
}

// ---------- bookings ----------
export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  return unwrap<BookingRow[]>(data, error).map(toBooking);
}

// ---------- content ----------
export async function fetchArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .order("created_at", { ascending: false });
  return unwrap<(ArticleRow & TaxonomyNames)[]>(data, error).map(toArticle);
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toArticle(data) : null;
}

export async function fetchVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_SELECT)
    .order("created_at", { ascending: false });
  return unwrap<(VideoRow & TaxonomyNames)[]>(data, error).map(toVideo);
}

// ---------- dashboard helpers ----------
/**
 * Tracker records inside an optional [from, to] window (ISO timestamps).
 * The date filter is pushed down to the query so the dashboard only pulls the
 * rows for the selected period.
 */
export async function fetchTrackersInRange(
  from?: string,
  to?: string,
): Promise<TrackerRecord[]> {
  let q = supabase.from("tracker_records").select("*");
  if (from) q = q.gte("date", from);
  if (to) q = q.lte("date", to);
  const { data, error } = await q.order("date", { ascending: false });
  return unwrap<TrackerRow[]>(data, error).map(toTracker);
}

/** Booking statuses that still need admin attention. */
export const OPEN_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "ongoing",
];

/** Service requests that are not yet resolved (completed / cancelled). */
export async function fetchOpenBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .in("status", OPEN_BOOKING_STATUSES)
    .order("created_at", { ascending: false });
  return unwrap<BookingRow[]>(data, error).map(toBooking);
}
