// Database tests for migration 0013 (issue #9), run against a LOCAL Supabase:
//
//   npx supabase start
//   SUPABASE_TEST_URL=http://127.0.0.1:54321 \
//   SUPABASE_TEST_ANON_KEY=<publishable / anon key from `supabase status`> \
//   SUPABASE_TEST_SERVICE_KEY=<secret / service_role key> \
//   npx vitest run supabase/tests
//
// They sign in as real admin / staff / family users and check what RLS and the
// triggers allow. Without the variables, or with a non-local URL, the suite is
// skipped — it creates and deletes users, so it must never run on production.
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

describe.skipIf(!enabled)(
  "migration 0013 — admin side & monitoring (local DB)",
  () => {
    let service: SupabaseClient;
    let admin: Actor;
    let staff: Actor;
    let staff2: Actor;
    let anak: Actor;
    let anak2: Actor;
    let parentId: string;
    let serviceTypeId: string;

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
      // Like the admin-users Edge Function: the sign-up trigger runs before
      // app_metadata is attached, so the role and status are set afterwards.
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
      staff2 = await actor("staff", "temanion2");
      anak = await actor("anak", "keluarga");
      anak2 = await actor("anak", "keluarga2");

      const { data: svc, error: svcErr } = await admin.db
        .from("service_types")
        .select("id")
        .eq("code", "care")
        .single();
      if (svcErr) throw svcErr;
      serviceTypeId = svc.id;

      const { data: p, error } = await admin.db
        .from("parents")
        .insert({
          full_name: `Puan Ujian ${run}`,
          ic: "510304-08-5432",
          gender: "P",
          address: "No. 12, Jalan Damai",
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
      for (const a of [admin, staff, staff2, anak, anak2]) {
        if (a) await service.auth.admin.deleteUser(a.id);
      }
    }, 60_000);

    // ---------- 1. Temanion details ----------
    describe("Temanion details on profiles", () => {
      const details = {
        tahun_lahir: 1973,
        jantina: "L",
        bangsa: "Melayu",
        warganegara: "Malaysia",
        lokasi: "Klang",
        alamat: "Setapak Indah, KL",
        kemahiran: ["Elderly", "First aid"],
      };

      it("admin can record them", async () => {
        const { error } = await admin.db
          .from("profiles")
          .update(details)
          .eq("id", staff.id);
        expect(error).toBeNull();
        const { data } = await admin.db
          .from("profiles")
          .select(
            "tahun_lahir,jantina,bangsa,warganegara,lokasi,alamat,kemahiran",
          )
          .eq("id", staff.id)
          .single();
        expect(data).toEqual(details);
      });

      it("a Temanion can read but not change them", async () => {
        const { data } = await staff.db
          .from("profiles")
          .select("lokasi")
          .eq("id", staff.id)
          .single();
        expect(data?.lokasi).toBe("Klang");
        const { error } = await staff.db
          .from("profiles")
          .update({ lokasi: "Johor" })
          .eq("id", staff.id);
        expect(error?.message).toMatch(/Hanya admin/);
      });

      it("a Temanion can still edit their own name and phone", async () => {
        const { error } = await staff.db
          .from("profiles")
          .update({ name: `Temanion ${run}`, phone: "019-1112222" })
          .eq("id", staff.id);
        expect(error).toBeNull();
      });

      it("rejects an impossible birth year and too many skills", async () => {
        const bad1 = await admin.db
          .from("profiles")
          .update({ tahun_lahir: 1800 })
          .eq("id", staff.id);
        expect(bad1.error?.message).toMatch(/profiles_tahun_lahir_range/);
        const many = Array.from({ length: 31 }, (_, i) => `Skill ${i}`);
        const bad2 = await admin.db
          .from("profiles")
          .update({ kemahiran: many })
          .eq("id", staff.id);
        expect(bad2.error?.message).toMatch(/profiles_kemahiran_size/);
      });
    });

    // ---------- 2. Penerima Servis location ----------
    it("admin can set a Penerima Servis location; the family cannot", async () => {
      const { error } = await admin.db
        .from("parents")
        .update({ lokasi: "Perak" })
        .eq("id", parentId);
      expect(error).toBeNull();
      const { data: seen } = await anak.db
        .from("parents")
        .select("lokasi")
        .eq("id", parentId)
        .single();
      expect(seen?.lokasi).toBe("Perak");
      // No family UPDATE policy on parents: the row is simply not updated.
      const { data: changed } = await anak.db
        .from("parents")
        .update({ lokasi: "Johor" })
        .eq("id", parentId)
        .select("id");
      expect(changed ?? []).toHaveLength(0);
    });

    // ---------- 3. bookings ----------
    describe("bookings", () => {
      const booking = (patch: Record<string, unknown> = {}) => ({
        anak_id: anak.id,
        parent_id: parentId,
        service_type_id: serviceTypeId,
        date: "2026-10-20",
        time: "09:30",
        transport: "hantar",
        location: "No. 12, Jalan Damai",
        ...patch,
      });

      it("a family can no longer create a booking", async () => {
        const { error } = await anak.db
          .from("bookings")
          .insert(booking({ status: "pending" }));
        expect(error?.message).toMatch(/row-level security/);
      });

      it("admin creates one for the family; approval time is stamped by the database", async () => {
        const before = Date.now();
        const { data, error } = await admin.db
          .from("bookings")
          .insert(
            booking({
              status: "confirmed",
              caregiver_id: staff.id,
              confirmed_at: "2000-01-01T00:00:00Z",
            }),
          )
          .select("id,confirmed_at")
          .single();
        expect(error).toBeNull();
        const stamped = Date.parse(data!.confirmed_at);
        expect(stamped).toBeGreaterThanOrEqual(before - 60_000); // the client value was ignored
        expect(stamped).toBeLessThanOrEqual(Date.now() + 60_000);
      });

      it("the first approval sticks through later status changes", async () => {
        const { data } = await admin.db
          .from("bookings")
          .insert(booking({ status: "pending" }))
          .select("id,confirmed_at")
          .single();
        expect(data!.confirmed_at).toBeNull();

        const confirm = await admin.db
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", data!.id)
          .select("confirmed_at")
          .single();
        const first = confirm.data!.confirmed_at;
        expect(first).not.toBeNull();

        for (const status of ["ongoing", "completed", "cancelled"]) {
          const r = await admin.db
            .from("bookings")
            .update({ status, confirmed_at: null })
            .eq("id", data!.id)
            .select("confirmed_at")
            .single();
          expect(r.data!.confirmed_at, status).toBe(first);
        }
      });

      it("a booking cancelled before approval never gets an approval time", async () => {
        const { data } = await admin.db
          .from("bookings")
          .insert(booking({ status: "pending" }))
          .select("id")
          .single();
        const r = await admin.db
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", data!.id)
          .select("confirmed_at")
          .single();
        expect(r.data!.confirmed_at).toBeNull();
      });

      it("a family cannot fake the approval time through their reschedule right", async () => {
        const { data } = await admin.db
          .from("bookings")
          .insert(booking({ status: "pending" }))
          .select("id")
          .single();
        const { error } = await anak.db
          .from("bookings")
          .update({ confirmed_at: "2001-01-01T00:00:00Z" })
          .eq("id", data!.id);
        expect(error).toBeNull();
        const { data: after } = await admin.db
          .from("bookings")
          .select("confirmed_at")
          .eq("id", data!.id)
          .single();
        expect(after!.confirmed_at).toBeNull();
      });

      it("families still see their own bookings only", async () => {
        const mine = await anak.db.from("bookings").select("id,anak_id");
        expect(mine.error).toBeNull();
        expect(mine.data!.length).toBeGreaterThan(0);
        expect(mine.data!.every((b) => b.anak_id === anak.id)).toBe(true);
        const other = await anak2.db.from("bookings").select("id");
        expect(other.data).toEqual([]);
      });

      it("the assigned Temanion still gets the service list, with the booker's name", async () => {
        const { data, error } = await staff.db.rpc("list_my_services");
        expect(error).toBeNull();
        expect(data!.length).toBeGreaterThan(0);
        expect(data![0].booked_by).toBe(`keluarga ${run}`);
      });
    });

    // ---------- 4. monitoring entries ----------
    describe("Manual 3 monitoring entries on tracker_records", () => {
      let recordId: string;
      const now = new Date().toISOString();
      const entries = {
        perkumuhan_entries: [
          {
            masa: now,
            jenis: "kencing",
            warnaUrin: 5,
            kekerapan: 2,
            pengesahan: "T",
          },
        ],
        tingkah_laku_entries: [
          { masa: now, mood: 2, interaksi: 1, pengesahan: "T" },
        ],
        posisi_entries: [
          {
            masa: now,
            posisi: "sisiKiri",
            tandaLukaTekanan: true,
            pengesahan: "T",
          },
        ],
        kesakitan_entries: [
          { masa: now, skor: 6, lokasi: "Lutut kiri", pengesahan: "T" },
        ],
        risiko_jatuh_entries: [
          { masa: now, faktor: ["keliru"], kejadian: "tiada", pengesahan: "T" },
        ],
      };

      it("the Temanion records all five lists on today's record", async () => {
        const { data, error } = await staff.db
          .from("tracker_records")
          .insert({ parent_id: parentId, staff_id: staff.id, status: "normal" })
          .select("id")
          .single();
        expect(error).toBeNull();
        recordId = data!.id;
        const up = await staff.db
          .from("tracker_records")
          .update(entries)
          .eq("id", recordId);
        expect(up.error).toBeNull();
      });

      it("the linked family reads them back unchanged", async () => {
        const { data, error } = await anak.db
          .from("tracker_records")
          .select(Object.keys(entries).join(","))
          .eq("id", recordId)
          .single();
        expect(error).toBeNull();
        expect(data).toEqual(entries);
      });

      it("an unrelated family and another Temanion cannot see or change them", async () => {
        const seen = await anak2.db
          .from("tracker_records")
          .select("id")
          .eq("id", recordId);
        expect(seen.data).toEqual([]);
        const changed = await staff2.db
          .from("tracker_records")
          .update({ kesakitan_entries: [] })
          .eq("id", recordId)
          .select("id");
        expect(changed.data ?? []).toHaveLength(0);
      });

      it("each list must be a JSON array", async () => {
        const { error } = await staff.db
          .from("tracker_records")
          .update({ kesakitan_entries: { skor: 3 } })
          .eq("id", recordId);
        expect(error?.message).toMatch(
          /tracker_records_kesakitan_entries_array/,
        );
      });
    });
  },
);
