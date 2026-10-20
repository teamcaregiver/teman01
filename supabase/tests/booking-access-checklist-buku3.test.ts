// Database tests for migration 0014 (issue #10), run against a LOCAL Supabase.
// Same setup and safety rules as admin-side-and-monitoring.test.ts:
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

describe.skipIf(!enabled)(
  "migration 0014 — booking access, default checklist, Buku 3 (local DB)",
  () => {
    let service: SupabaseClient;
    let admin: Actor;
    let staff: Actor; // the Temanion on the booking
    let staff2: Actor; // a Temanion with no link to the person
    let anak: Actor;
    let parentId: string;
    let serviceTypeId: string;
    // Rows that existed before the suite, put back afterwards.
    let savedDefault: Record<string, unknown> | null = null;
    let savedRutin: Record<string, unknown> | null = null;
    const addedSections: string[] = [];

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

      const { data: svc, error: svcErr } = await admin.db
        .from("service_types")
        .select("id")
        .eq("code", "care")
        .single();
      if (svcErr) throw svcErr;
      serviceTypeId = svc.id;

      // No staff_id: the booking is this person's only link to a Temanion.
      const { data: p, error } = await admin.db
        .from("parents")
        .insert({
          full_name: `Puan Ujian ${run}`,
          ic: "510304-08-5432",
          gender: "P",
          address: "No. 23, Jalan Seri Melati",
          phone: "012-3456789",
        })
        .select("id")
        .single();
      if (error) throw error;
      parentId = p.id;
      const { error: linkErr } = await admin.db
        .from("parent_anak")
        .insert({ parent_id: parentId, anak_id: anak.id });
      if (linkErr) throw linkErr;

      const d = await service
        .from("checklist_default")
        .select("*")
        .maybeSingle();
      savedDefault = d.data;
      await service.from("checklist_default").delete().eq("id", true);
      const r = await service
        .from("buku3_bahagian")
        .select("*")
        .eq("kunci", "rutin")
        .maybeSingle();
      savedRutin = r.data;
      await service.from("buku3_bahagian").delete().eq("kunci", "rutin");
    }, 60_000);

    afterAll(async () => {
      if (!service) return;
      await service.from("checklist_default").delete().eq("id", true);
      if (savedDefault)
        await service.from("checklist_default").insert(savedDefault);
      await service.from("buku3_bahagian").delete().eq("kunci", "rutin");
      if (savedRutin) await service.from("buku3_bahagian").insert(savedRutin);
      if (addedSections.length)
        await service.from("buku3_bahagian").delete().in("id", addedSections);
      if (parentId) await service.from("parents").delete().eq("id", parentId);
      // Deleting the family account also removes its bookings (on delete cascade).
      for (const a of [admin, staff, staff2, anak]) {
        if (a) await service.auth.admin.deleteUser(a.id);
      }
    }, 60_000);

    // ---------- 1. booking access ----------
    describe("a booking gives its Temanion access to the person", () => {
      let bookingId: string;

      const canSee = async (a: Actor) => {
        const { data, error } = await a.db
          .from("parents")
          .select("id")
          .eq("id", parentId);
        expect(error).toBeNull();
        return (data ?? []).length === 1;
      };
      const setStatus = async (status: string) => {
        const { error } = await admin.db
          .from("bookings")
          .update({ status })
          .eq("id", bookingId);
        expect(error).toBeNull();
      };

      it("no Temanion sees the person before a booking", async () => {
        expect(await canSee(staff)).toBe(false);
        expect(await canSee(staff2)).toBe(false);
        expect(await canSee(anak)).toBe(true);
      });

      it("the booking's Temanion sees them while it is pending, confirmed or ongoing", async () => {
        const { data, error } = await admin.db
          .from("bookings")
          .insert({
            anak_id: anak.id,
            parent_id: parentId,
            service_type_id: serviceTypeId,
            date: "2026-10-20",
            time: "08:30",
            transport: "hantar",
            location: "No. 23, Jalan Seri Melati",
            status: "pending",
            caregiver_id: staff.id,
          })
          .select("id")
          .single();
        expect(error).toBeNull();
        bookingId = data!.id;

        expect(await canSee(staff)).toBe(true);
        await setStatus("confirmed");
        expect(await canSee(staff)).toBe(true);
        await setStatus("ongoing");
        expect(await canSee(staff)).toBe(true);
        expect(await canSee(staff2)).toBe(false);

        const { data: services } = await staff.db.rpc("list_my_services");
        expect(services).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: bookingId,
              parent_id: parentId,
              client_name: `Puan Ujian ${run}`,
            }),
          ]),
        );
      });

      it("they can work on the person's records; another Temanion cannot", async () => {
        const items = [{ id: "c1", label: "Mandi / kebersihan diri" }];
        const own = await staff.db
          .from("parent_checklists")
          .upsert({ parent_id: parentId, items }, { onConflict: "parent_id" });
        expect(own.error).toBeNull();
        const other = await staff2.db
          .from("parent_checklists")
          .upsert({ parent_id: parentId, items }, { onConflict: "parent_id" });
        expect(other.error?.message).toMatch(/row-level security/);

        const med = await admin.db
          .from("medications")
          .insert({
            parent_id: parentId,
            nama_ubat: `Ubat ${run}`,
            dos: "1 biji",
            kekerapan: "Pagi",
          })
          .select("id")
          .single();
        expect(med.error).toBeNull();
        const { data: meds } = await staff.db
          .from("medications")
          .select("id")
          .eq("parent_id", parentId);
        expect(meds).toHaveLength(1);
        const { data: hidden } = await staff2.db
          .from("medications")
          .select("id")
          .eq("parent_id", parentId);
        expect(hidden ?? []).toHaveLength(0);

        const rec = await staff.db.from("tracker_records").insert({
          parent_id: parentId,
          staff_id: staff.id,
          date: new Date().toISOString(),
          status: "normal",
        });
        expect(rec.error).toBeNull();
      });

      it("access ends when the booking is completed or cancelled; their records stay", async () => {
        await setStatus("completed");
        expect(await canSee(staff)).toBe(false);
        const { data: records } = await staff.db
          .from("tracker_records")
          .select("id")
          .eq("parent_id", parentId);
        expect(records ?? []).toHaveLength(1);
        const { data: meds } = await staff.db
          .from("medications")
          .select("id")
          .eq("parent_id", parentId);
        expect(meds ?? []).toHaveLength(0);

        await setStatus("cancelled");
        expect(await canSee(staff)).toBe(false);
      });

      it("a Temanion set as the person's staff keeps access as before", async () => {
        const set = await admin.db
          .from("parents")
          .update({ staff_id: staff2.id })
          .eq("id", parentId);
        expect(set.error).toBeNull();
        expect(await canSee(staff2)).toBe(true);
        expect(await canSee(staff)).toBe(false);
        await admin.db
          .from("parents")
          .update({ staff_id: null })
          .eq("id", parentId);
        expect(await canSee(staff2)).toBe(false);
      });
    });

    // ---------- 2. default checklist ----------
    describe("default checklist", () => {
      const items = [
        { id: "c1", label: `Mandi ${run}` },
        { id: "c-baru", label: "Sapu losyen" },
      ];

      it("has no row until admin changes it, and signed-in users can read it", async () => {
        for (const a of [staff, anak]) {
          const { data, error } = await a.db
            .from("checklist_default")
            .select("items");
          expect(error).toBeNull();
          expect(data).toEqual([]);
        }
      });

      it("only admin can set it, and the change is stamped", async () => {
        const denied = await staff.db
          .from("checklist_default")
          .upsert({ id: true, items }, { onConflict: "id" });
        expect(denied.error?.message).toMatch(/row-level security/);

        const saved = await admin.db
          .from("checklist_default")
          .upsert({ id: true, items }, { onConflict: "id" })
          .select("items,updated_by")
          .single();
        expect(saved.error).toBeNull();
        expect(saved.data).toEqual({ items, updated_by: admin.id });

        const { data } = await staff.db
          .from("checklist_default")
          .select("items")
          .single();
        expect(data?.items).toEqual(items);

        const notChanged = await staff.db
          .from("checklist_default")
          .update({ items: [{ id: "x", label: "x" }] })
          .eq("id", true)
          .select("id");
        expect(notChanged.data ?? []).toHaveLength(0);
      });

      it("is one row of 1–50 items", async () => {
        const second = await admin.db
          .from("checklist_default")
          .insert({ id: false, items });
        expect(second.error?.message).toMatch(/checklist_default_one_row/);
        const empty = await admin.db
          .from("checklist_default")
          .update({ items: [] })
          .eq("id", true);
        expect(empty.error?.message).toMatch(/checklist_default_items_array/);
        const notArray = await admin.db
          .from("checklist_default")
          .update({ items: { id: "c1" } })
          .eq("id", true);
        expect(notArray.error?.message).toMatch(
          /checklist_default_items_array/,
        );
      });

      it("deleting the row brings back the built-in list", async () => {
        const del = await admin.db
          .from("checklist_default")
          .delete()
          .eq("id", true);
        expect(del.error).toBeNull();
        const { data } = await staff.db
          .from("checklist_default")
          .select("items");
        expect(data).toEqual([]);
      });
    });

    // ---------- 3. Buku 3 sections ----------
    describe("Buku 3 sections", () => {
      it("admin changes a built-in section; families and Temanion read it", async () => {
        const saved = await admin.db
          .from("buku3_bahagian")
          .upsert(
            { kunci: "rutin", kandungan: `<p>Ujian ${run}</p>` },
            { onConflict: "kunci" },
          )
          .select("tajuk,kandungan,urutan,visibility,updated_by")
          .single();
        expect(saved.error).toBeNull();
        expect(saved.data).toEqual({
          tajuk: null,
          kandungan: `<p>Ujian ${run}</p>`,
          urutan: null,
          visibility: "published",
          updated_by: admin.id,
        });
        // Moving it later only touches the position.
        const moved = await admin.db
          .from("buku3_bahagian")
          .upsert({ kunci: "rutin", urutan: 5 }, { onConflict: "kunci" })
          .select("kandungan,urutan")
          .single();
        expect(moved.data).toEqual({
          kandungan: `<p>Ujian ${run}</p>`,
          urutan: 5,
        });

        for (const a of [anak, staff]) {
          const { data } = await a.db
            .from("buku3_bahagian")
            .select("kandungan")
            .eq("kunci", "rutin")
            .single();
          expect(data?.kandungan).toBe(`<p>Ujian ${run}</p>`);
        }
      });

      it("built-in sections stay published and keys must be known", async () => {
        const hide = await admin.db
          .from("buku3_bahagian")
          .update({ visibility: "draft" })
          .eq("kunci", "rutin");
        expect(hide.error?.message).toMatch(/buku3_bahagian_asal_diterbitkan/);
        const unknown = await admin.db
          .from("buku3_bahagian")
          .insert({ kunci: "bukan-unit", tajuk: "x" });
        expect(unknown.error?.message).toMatch(/buku3_bahagian_kunci_check/);
        const blankTitle = await admin.db
          .from("buku3_bahagian")
          .update({ tajuk: "   " })
          .eq("kunci", "rutin");
        expect(blankTitle.error?.message).toMatch(
          /buku3_bahagian_tajuk_panjang/,
        );
      });

      it("an added section needs its title, text and position", async () => {
        const missing = await admin.db
          .from("buku3_bahagian")
          .insert({ tajuk: `Tambahan ${run}`, urutan: 140 });
        expect(missing.error?.message).toMatch(
          /buku3_bahagian_tambahan_lengkap/,
        );
      });

      it("a draft is for admin only until it is published", async () => {
        const { data, error } = await admin.db
          .from("buku3_bahagian")
          .insert({
            tajuk: `Unit 10 ${run}`,
            kandungan: "<p>Penjagaan kulit</p>",
            urutan: 140,
            visibility: "draft",
          })
          .select("id")
          .single();
        expect(error).toBeNull();
        addedSections.push(data!.id);

        const seenBy = async (a: Actor) =>
          (
            (await a.db.from("buku3_bahagian").select("id").eq("id", data!.id))
              .data ?? []
          ).length;
        expect(await seenBy(admin)).toBe(1);
        expect(await seenBy(anak)).toBe(0);
        expect(await seenBy(staff)).toBe(0);

        await admin.db
          .from("buku3_bahagian")
          .update({ visibility: "published" })
          .eq("id", data!.id);
        expect(await seenBy(anak)).toBe(1);
      });

      it("only admin writes", async () => {
        const insert = await anak.db
          .from("buku3_bahagian")
          .insert({ tajuk: "x", kandungan: "<p>x</p>", urutan: 999 });
        expect(insert.error?.message).toMatch(/row-level security/);
        const update = await staff.db
          .from("buku3_bahagian")
          .update({ kandungan: "<p>diubah</p>" })
          .eq("kunci", "rutin")
          .select("id");
        expect(update.data ?? []).toHaveLength(0);
        const del = await anak.db
          .from("buku3_bahagian")
          .delete()
          .eq("kunci", "rutin")
          .select("id");
        expect(del.data ?? []).toHaveLength(0);
      });
    });
  },
);
