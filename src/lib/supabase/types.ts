// Hand-written DB types mirroring supabase/migrations/0001_init.sql.
// (Regenerate later with `supabase gen types typescript` if the CLI is set up.)
import type {
  VitalEntry,
  UbatanEntry,
  MakananEntry,
  ChecklistItemData,
} from "@/lib/mock-data";

export type Role = "admin" | "staff" | "anak";
export type UserStatus = "active" | "pending" | "rejected" | "inactive";
export type Gender = "L" | "P";
export type TrackerStatus = "normal" | "attention" | "critical";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled";
export type PaymentStatus = "belum_bayar" | "deposit" | "telah_bayar";
export type ServiceType = "companion" | "care";
export type TransportMode = "sendiri" | "hantar" | "pickup";
export type ContentVisibility = "published" | "draft";

// NOTE: these MUST be `type` aliases, not `interface`. Interfaces lack an
// implicit index signature, so they don't satisfy supabase-js's
// `Record<string, unknown>` constraint and the whole schema collapses to `never`.
export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  phone: string | null;
  created_at: string;
};

export type ParentRow = {
  id: string;
  full_name: string;
  ic: string;
  birth_date: string | null;
  gender: Gender;
  address: string;
  phone: string;
  medical_condition: string;
  medication: string;
  emergency_contact: string;
  relationship: string;
  staff_id: string | null;
  jenis_darah: string | null;
  alahan: string | null;
  nama_doktor: string | null;
  tel_doktor: string | null;
  hospital_rujukan: string | null;
  no_insurans: string | null;
  status_mobiliti: string | null;
  status_kognitif: string | null;
  sekatan_pemakanan: string | null;
  created_at: string;
};

export type ParentAnakRow = {
  parent_id: string;
  anak_id: string;
};

export type MedicationRow = {
  id: string;
  parent_id: string;
  nama_ubat: string;
  dos: string | null;
  cara_pengambilan: string | null;
  kekerapan: string | null;
  catatan: string | null;
  prn: boolean;
  prn_type: string | null;
};

export type CaregiverRow = {
  id: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  specialization: string | null;
  experience_years: number | null;
  rating: number | null;
  notes: string | null;
};

export type TrackerRow = {
  id: string;
  parent_id: string;
  staff_id: string | null;
  date: string;
  status: TrackerStatus;
  vital_entries: VitalEntry[] | null;
  ubatan_entries: UbatanEntry[] | null;
  makanan_entries: MakananEntry[] | null;
  aktiviti: string | null;
  aktiviti_pengesahan: string | null;
  gambar: string[] | null;
  checklist: ChecklistItemData[] | null;
  catatan_khas: string | null;
  edited_by_admin: boolean | null;
  edited_at: string | null;
  edit_allowed: boolean | null;
  created_at: string;
};

export type BookingRow = {
  id: string;
  anak_id: string;
  parent_id: string | null;
  service_type: ServiceType;
  date: string | null;
  time: string | null;
  transport: TransportMode | null;
  location: string | null;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  caregiver_id: string | null;
  price: number | null;
  payment_status: PaymentStatus | null;
};

export type ArticleRow = {
  id: string;
  title: string;
  topic: string | null;
  subtopic: string | null;
  cover_image: string | null;
  body: string | null;
  pdf_url: string | null;
  pdf_name: string | null;
  youtube_url: string | null;
  visibility: ContentVisibility;
  views: number;
  created_at: string;
};

export type VideoRow = {
  id: string;
  title: string;
  topic: string | null;
  subtopic: string | null;
  url: string | null;
  description: string | null;
  pdf_url: string | null;
  pdf_name: string | null;
  visibility: ContentVisibility;
  views: number;
  created_at: string;
};

type Tbl<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Tbl<ProfileRow>;
      parents: Tbl<ParentRow>;
      parent_anak: Tbl<ParentAnakRow, ParentAnakRow, Partial<ParentAnakRow>>;
      medications: Tbl<MedicationRow>;
      caregivers: Tbl<CaregiverRow>;
      tracker_records: Tbl<TrackerRow>;
      bookings: Tbl<BookingRow>;
      articles: Tbl<ArticleRow>;
      videos: Tbl<VideoRow>;
    };
    // Empty mapped types (NOT Record<string, never>, which would intersect every
    // table with `never` and break `.from()` typing).
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      role: Role;
      user_status: UserStatus;
      gender: Gender;
      tracker_status: TrackerStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      service_type: ServiceType;
      transport_mode: TransportMode;
      content_visibility: ContentVisibility;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
