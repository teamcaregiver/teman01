// Hand-written DB types mirroring supabase/migrations (0001_init.sql onwards).
// (Regenerate later with `supabase gen types typescript` if the CLI is set up.)
import type {
  VitalEntry,
  UbatanEntry,
  MakananEntry,
  ChecklistItemData,
} from "@/lib/mock-data";
import type {
  KesakitanEntry,
  PerkumuhanEntry,
  PosisiEntry,
  RisikoJatuhEntry,
  TingkahLakuEntry,
} from "@/lib/pemantauan";

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
  avatar_url: string | null;
  // Caregiver details — meaningful for role 'staff', admin-managed.
  specialization: string | null;
  experience_years: number | null;
  rating: number | null;
  notes: string | null;
  // Temanion details (migration 0013) — admin-managed.
  tahun_lahir: number | null;
  jantina: Gender | null;
  bangsa: string | null;
  warganegara: string | null;
  lokasi: string | null;
  alamat: string | null;
  kemahiran: string[] | null;
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
  archived_at: string | null;
  lokasi: string | null;
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

/** One row of the `list_caregivers()` RPC — a staff profile's public card. */
export type CaregiverRow = {
  id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  status: UserStatus;
  specialization: string | null;
  experience_years: number | null;
  rating: number | null;
  notes: string | null;
};

export type ServiceTypeRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
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
  // Manual 3 monitoring lists (migration 0013).
  perkumuhan_entries: PerkumuhanEntry[] | null;
  tingkah_laku_entries: TingkahLakuEntry[] | null;
  posisi_entries: PosisiEntry[] | null;
  kesakitan_entries: KesakitanEntry[] | null;
  risiko_jatuh_entries: RisikoJatuhEntry[] | null;
  created_at: string;
};

export type BookingRow = {
  id: string;
  anak_id: string;
  parent_id: string | null;
  service_type_id: string;
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
  payment_notes: string | null;
  confirmed_at: string | null; // set by trg_booking_confirmed (migration 0013)
};

export type ArticleRow = {
  id: string;
  title: string;
  topic_id: string | null;
  subtopic_id: string | null;
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
  topic_id: string | null;
  subtopic_id: string | null;
  url: string | null;
  description: string | null;
  pdf_url: string | null;
  pdf_name: string | null;
  visibility: ContentVisibility;
  views: number;
  created_at: string;
};

export type TopicRow = {
  id: string;
  name: string;
  created_at: string;
};

export type SubtopicRow = {
  id: string;
  topic_id: string;
  name: string;
  created_at: string;
};

// Borang board (migration 0011). created_by / created_by_name / timestamps are
// stamped by a trigger; deleted_at is set through soft_delete_form_link().
export type FormLinkRow = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
};

// A resident's own daily checklist (migration 0012). No row = default list.
// updated_at / updated_by are stamped by a trigger.
export type ParentChecklistRow = {
  parent_id: string;
  items: { id: string; label: string }[];
  updated_at: string;
  updated_by: string | null;
};

// The admin-edited default checklist (migration 0014). One row at most
// (id is always true); no row = the built-in list.
export type ChecklistDefaultRow = {
  id: boolean;
  items: { id: string; label: string }[];
  updated_at: string;
  updated_by: string | null;
};

// Admin's edits to Buku 3 (migration 0014). With `kunci` the row changes a
// built-in section (null fields keep the built-in value); without it the row
// is a section admin added.
export type Buku3BahagianRow = {
  id: string;
  kunci: string | null;
  tajuk: string | null;
  kandungan: string | null;
  urutan: number | null;
  visibility: ContentVisibility;
  // Attachments, as on articles (migration 0016).
  cover_image: string | null;
  pdf_url: string | null;
  pdf_name: string | null;
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

/** One row of the `list_my_services()` RPC — an open service assigned to the caller. */
export type MyServiceRow = {
  id: string;
  parent_id: string | null;
  client_name: string | null;
  booked_by: string | null;
  service_name: string;
  date: string | null;
  time: string | null;
  location: string | null;
  status: BookingStatus;
};

type Tbl<
  Row,
  Insert = Partial<Row>,
  Update = Partial<Row>,
  Relationships extends unknown[] = [],
> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

// Foreign keys that queries embed (`select("*, topic:topics!…(name)")`).
// Names must match the constraints created in migration 0009.
type TaxonomyRelationships<T extends string> = [
  {
    foreignKeyName: `${T}_topic_id_fkey`;
    columns: ["topic_id"];
    isOneToOne: false;
    referencedRelation: "topics";
    referencedColumns: ["id"];
  },
  {
    foreignKeyName: `${T}_subtopic_fkey`;
    columns: ["subtopic_id", "topic_id"];
    isOneToOne: false;
    referencedRelation: "subtopics";
    referencedColumns: ["id", "topic_id"];
  },
];

export interface Database {
  public: {
    Tables: {
      profiles: Tbl<ProfileRow>;
      parents: Tbl<ParentRow>;
      parent_anak: Tbl<ParentAnakRow, ParentAnakRow, Partial<ParentAnakRow>>;
      medications: Tbl<MedicationRow>;
      tracker_records: Tbl<TrackerRow>;
      bookings: Tbl<BookingRow>;
      service_types: Tbl<ServiceTypeRow>;
      articles: Tbl<ArticleRow, Partial<ArticleRow>, Partial<ArticleRow>, TaxonomyRelationships<"articles">>;
      videos: Tbl<VideoRow, Partial<VideoRow>, Partial<VideoRow>, TaxonomyRelationships<"videos">>;
      topics: Tbl<TopicRow>;
      subtopics: Tbl<SubtopicRow>;
      form_links: Tbl<FormLinkRow>;
      parent_checklists: Tbl<ParentChecklistRow>;
      checklist_default: Tbl<ChecklistDefaultRow>;
      buku3_bahagian: Tbl<Buku3BahagianRow>;
    };
    // Empty mapped type (NOT Record<string, never>, which would intersect every
    // table with `never` and break `.from()` typing).
    Views: { [_ in never]: never };
    Functions: {
      list_caregivers: { Args: Record<string, never>; Returns: CaregiverRow[] };
      soft_delete_form_link: { Args: { p_id: string }; Returns: undefined };
      list_my_services: { Args: Record<string, never>; Returns: MyServiceRow[] };
    };
    Enums: {
      role: Role;
      user_status: UserStatus;
      gender: Gender;
      tracker_status: TrackerStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      transport_mode: TransportMode;
      content_visibility: ContentVisibility;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
