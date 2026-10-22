// Database tests for migration 0015 (Google Drive file registry), run against a
// LOCAL Supabase. Same setup and safety rules as the other suites here:
//
//   npx supabase start
//   SUPABASE_TEST_URL=http://127.0.0.1:54321 \
//   SUPABASE_TEST_ANON_KEY=<publishable / anon key from `supabase status`> \
//   SUPABASE_TEST_SERVICE_KEY=<secret / service_role key> \
//   npx vitest run supabase/tests
//
// The drive-files Edge Function relies on these policies for every access
// decision, so they are what is tested; Drive itself is not called.
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
  "migration 0015 — drive_files access (local DB)",
  () => {
    let service: SupabaseClient;
    let admin: Actor;
    let staff: Actor; // assigned to the person
    let staff2: Actor; // no link to the person
    let anak: Actor; // linked family member
    let anak2: Actor; // unrelated family member
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

    const row = (a: Actor, kind: string, scope: string | null) => ({
      kind,
      scope_id: scope,
      folder: kind === "content" ? "articles" : null,
      name: "ujian.jpg",
      mime_type: "image/jpeg",
      size_bytes: 1234,
      uploaded_by: a.id,
    });

    const insert = (a: Actor, kind: string, scope: string | null) =>
      a.db
        .from("drive_files")
        .insert(row(a, kind, scope))
        .select("id")
        .single();

    /** A finished upload, as the Edge Function leaves it. */
    async function finished(
      kind: string,
      scope: string | null,
    ): Promise<string> {
      const driveId = `drive-${crypto.randomUUID()}`;
      const { error } = await service
        .from("drive_files")
        .insert({ ...row(admin, kind, scope), drive_file_id: driveId });
      if (error) throw error;
      return driveId;
    }

    const canSee = async (a: Actor, driveId: string) => {
      const { data, error } = await a.db
        .from("drive_files")
        .select("id")
        .eq("drive_file_id", driveId);
      if (error) throw error;
      return data.length === 1;
    };

    beforeAll(async () => {
      service = createClient(URL_, SERVICE, opts);
      admin = await actor("admin", "admin");
      staff = await actor("staff", "temanion");
      staff2 = await actor("staff", "temanion2");
      anak = await actor("anak", "keluarga");
      anak2 = await actor("anak", "keluarga2");

      const { data: p, error } = await admin.db
        .from("parents")
        .insert({
          full_name: `Puan Ujian ${run}`,
          gender: "P",
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
      await service.from("drive_files").delete().like("name", "ujian.%");
      if (parentId) await service.from("parents").delete().eq("id", parentId);
      for (const a of [admin, staff, staff2, anak, anak2]) {
        if (a) await service.auth.admin.deleteUser(a.id);
      }
    }, 60_000);

    describe("who may register an upload", () => {
      it("content: admin only", async () => {
        expect((await insert(admin, "content", null)).error).toBeNull();
        expect((await insert(staff, "content", null)).error).not.toBeNull();
        expect((await insert(anak, "content", null)).error).not.toBeNull();
      });

      it("avatar: only into the uploader's own scope", async () => {
        expect((await insert(anak, "avatar", anak.id)).error).toBeNull();
        expect((await insert(anak, "avatar", anak2.id)).error).not.toBeNull();
      });

      it("activity: admin and the assigned staff, not others", async () => {
        expect((await insert(admin, "activity", parentId)).error).toBeNull();
        expect((await insert(staff, "activity", parentId)).error).toBeNull();
        expect(
          (await insert(staff2, "activity", parentId)).error,
        ).not.toBeNull();
        expect((await insert(anak, "activity", parentId)).error).not.toBeNull();
      });

      it("cannot forge the uploader or the Drive id", async () => {
        const forged = await staff.db.from("drive_files").insert({
          ...row(staff, "activity", parentId),
          uploaded_by: admin.id,
        });
        expect(forged.error).not.toBeNull();
        const preset = await staff.db.from("drive_files").insert({
          ...row(staff, "activity", parentId),
          drive_file_id: "stolen",
        });
        expect(preset.error).not.toBeNull();
      });
    });

    describe("who may see a file", () => {
      it("activity photos: admin, assigned staff and linked family only", async () => {
        const id = await finished("activity", parentId);
        expect(await canSee(admin, id)).toBe(true);
        expect(await canSee(staff, id)).toBe(true);
        expect(await canSee(anak, id)).toBe(true);
        expect(await canSee(staff2, id)).toBe(false);
        expect(await canSee(anak2, id)).toBe(false);
      });

      it("content and avatars are public", async () => {
        const content = await finished("content", null);
        const avatar = await finished("avatar", anak.id);
        expect(await canSee(anak2, content)).toBe(true);
        expect(await canSee(staff2, avatar)).toBe(true);
      });
    });

    describe("who may delete a file", () => {
      const remove = async (a: Actor, driveId: string) => {
        const { data, error } = await a.db
          .from("drive_files")
          .delete()
          .eq("drive_file_id", driveId)
          .select("id");
        if (error) throw error;
        return data.length === 1;
      };

      it("linked family can see a photo but not delete it", async () => {
        const id = await finished("activity", parentId);
        expect(await remove(anak, id)).toBe(false);
        expect(await remove(staff2, id)).toBe(false);
        expect(await remove(staff, id)).toBe(true);
      });

      it("nobody but the service role can repoint a row", async () => {
        const id = await finished("activity", parentId);
        const { data } = await staff.db
          .from("drive_files")
          .update({ drive_file_id: "other" })
          .eq("drive_file_id", id)
          .select("id");
        expect(data ?? []).toHaveLength(0);
      });
    });
  },
);
