// Hand-written DB types for the tables touched in Phase 2 (auth + accounts).
// Regenerate the full set later with the Supabase MCP `generate_typescript_types`
// (or `supabase gen types typescript`) once the CLI/MCP is connected.

export type Role = "admin" | "staff" | "anak";
export type UserStatus = "active" | "pending" | "rejected" | "inactive";
export type Gender = "L" | "P";

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
}

export type ParentAnakRow = {
  parent_id: string;
  anak_id: string;
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
    };
    // Empty mapped types (NOT Record<string, never>, which would intersect every
    // table with `never` and break `.from()` typing).
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      role: Role;
      user_status: UserStatus;
      gender: Gender;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
