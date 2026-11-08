// Database tests for migration 0017 (issue #12), run against a LOCAL Supabase.
// Same setup and safety rules as the other files in this folder:
//
//   npx supabase start
//   SUPABASE_TEST_URL=http://127.0.0.1:54321 \
//   SUPABASE_TEST_ANON_KEY=<publishable / anon key from `supabase status`> \
//   SUPABASE_TEST_SERVICE_KEY=<secret / service_role key> \
//   npx vitest run supabase/tests
//
// Without the variables, or with a non-local URL, the suite is skipped — it
// creates and deletes users, so it must never run on production.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const URL_ = process.env.SUPABASE_TEST_URL ?? "";
const ANON = process.env.SUPABASE_TEST_ANON_KEY ?? "";
const SERVICE = process.env.SUPABASE_TEST_SERVICE_KEY ?? "";
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(URL_);
const enabled = isLocal && !!ANON && !!SERVICE;

type Role = "admin" | "staff" | "anak";
type Actor = { id: string; email: string; db: SupabaseClient };

const run = Date.now().toString(36);
const PASSWORD = "Ujian-12345";
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

const BOOKER = {
  ic: "900101-14-5678",
  nama_majikan: "Syarikat Ujian Sdn Bhd",
  no_pekerja: "E-1024",
  kecemasan_nama: "Ahmad bin Ali",
  kecemasan_telefon: "013-9876543",
};

describe.skipIf(!enabled)(
  "migration 0017 — booker and care recipient details (local DB)",
  () => {
    let service: SupabaseClient;
    let admin: Actor;
    let staff: Actor;
    let anak: Actor;
    let anak2: Actor; // another family, no link to anyone here
    let parentId: string;

    async function actor(role: Role, name: string): Promise<Actor> {
      const email = `${role}-${name}-${run}@ujian.local`;
      const { data, error } = await service.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: `${name} ${run}` },
        app_metadata: { role },
      });
      if (error || !data.user) throw error ?? new Error("createUser failed");
      // The sign-up trigger runs before app_metadata is attached, so the role
      // and status are set afterwards (as the admin-users Edge Function does).
      const { error: pErr } = await service
        .from("profiles")
        .update({ role, status: "active" })
        .eq("id", data.user.id);
      if (pErr) throw pErr;
      const db = createClient(URL_, ANON, opts);
      const { error: sErr } = await db.auth.signInWithPassword({
        email,
        password: PASSWORD,
      });
      if (sErr) throw sErr;
      return { id: data.user.id, email, db };
    }

    beforeAll(async () => {
      service = createClient(URL_, SERVICE, opts);
      admin = await actor("admin", "admin");
      staff = await actor("staff", "temanion");
      anak = await actor("anak", "keluarga");
      anak2 = await actor("anak", "keluarga2");

      const { data: p, error } = await admin.db
        .from("parents")
        .insert({
          full_name: `Puan Ujian ${run}`,
          ic: "510304-08-5432",
          gender: "P",
          address: "No. 23, Jalan Seri Melati",
          phone: "012-3456789",
          staff_id: staff.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      parentId = p.id;
      const { error: linkErr } = await admin.db
        .from("parent_anak")
        .insert({ parent_id: parentId, anak_id: anak.id });
      if (linkErr) throw linkErr;
    }, 60_000);

    afterAll(async () => {
      if (!service) return;
      if (parentId) await service.from("parents").delete().eq("id", parentId);
      for (const a of [admin, staff, anak, anak2]) {
        if (a) await service.auth.admin.deleteUser(a.id);
      }
    }, 60_000);

    // ---------- 1. booker details on profiles ----------
    describe("booker details", () => {
      it("a family account saves and reads back its own details", async () => {
        const { error } = await anak.db
          .from("profiles")
          .update(BOOKER)
          .eq("id", anak.id);
        expect(error).toBeNull();
        const { data } = await anak.db
          .from("profiles")
          .select("ic,nama_majikan,no_pekerja,kecemasan_nama,kecemasan_telefon")
          .eq("id", anak.id)
          .single();
        expect(data).toEqual(BOOKER);
      });

      it("admin can read them", async () => {
        const { data } = await admin.db
          .from("profiles")
          .select("ic,kecemasan_nama")
          .eq("id", anak.id)
          .single();
        expect(data).toEqual({
          ic: BOOKER.ic,
          kecemasan_nama: BOOKER.kecemasan_nama,
        });
      });

      it("the Temanion caring for their parent and other families cannot", async () => {
        for (const other of [staff, anak2]) {
          const { data } = await other.db
            .from("profiles")
            .select("ic")
            .eq("id", anak.id);
          expect(data ?? []).toEqual([]);
        }
      });

      it("nobody else can write them", async () => {
        await anak2.db
          .from("profiles")
          .update({ ic: "000000-00-0000" })
          .eq("id", anak.id);
        const { data } = await service
          .from("profiles")
          .select("ic")
          .eq("id", anak.id)
          .single();
        expect(data?.ic).toBe(BOOKER.ic);
      });

      it("rejects an over-long IC", async () => {
        const { error } = await anak.db
          .from("profiles")
          .update({ ic: "1".repeat(21) })
          .eq("id", anak.id);
        expect(error?.message).toMatch(/profiles_penempah_panjang/);
      });
    });

    // ---------- 2. care recipient details on parents ----------
    describe("care recipient details", () => {
      it("admin saves language, weight and height", async () => {
        const { error } = await admin.db
          .from("parents")
          .update({ bahasa_pilihan: "Hokkien", berat_kg: 58.5, tinggi_cm: 152 })
          .eq("id", parentId);
        expect(error).toBeNull();
      });

      it("the linked family and the Temanion can read them", async () => {
        for (const reader of [anak, staff]) {
          const { data } = await reader.db
            .from("parents")
            .select("bahasa_pilihan,berat_kg,tinggi_cm")
            .eq("id", parentId)
            .single();
          expect(data?.bahasa_pilihan).toBe("Hokkien");
          expect(Number(data?.berat_kg)).toBe(58.5);
          expect(Number(data?.tinggi_cm)).toBe(152);
        }
      });

      it("a family can register a person with them", async () => {
        const id = crypto.randomUUID();
        const { error } = await anak.db.from("parents").insert({
          id,
          full_name: `Encik Ujian ${run}`,
          ic: "480712-10-1234",
          gender: "L",
          bahasa_pilihan: "Tamil",
          berat_kg: 70,
          tinggi_cm: 168.5,
        });
        expect(error).toBeNull();
        await service.from("parents").delete().eq("id", id);
      });

      it.each([
        ["berat_kg", 5, /parents_berat_kg_julat/],
        ["berat_kg", 301, /parents_berat_kg_julat/],
        ["tinggi_cm", 1.6, /parents_tinggi_cm_julat/],
        ["tinggi_cm", 251, /parents_tinggi_cm_julat/],
        ["bahasa_pilihan", "x".repeat(61), /parents_bahasa_pilihan_panjang/],
      ])("rejects %s = %s", async (column, value, constraint) => {
        const { error } = await admin.db
          .from("parents")
          .update({ [column]: value })
          .eq("id", parentId);
        expect(error?.message).toMatch(constraint);
      });

      it("keeps the columns optional for people registered before issue #12", async () => {
        const { error } = await admin.db
          .from("parents")
          .update({ bahasa_pilihan: null, berat_kg: null, tinggi_cm: null })
          .eq("id", parentId);
        expect(error).toBeNull();
      });
    });
  },
);
