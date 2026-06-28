import { createServerFn } from "@tanstack/react-start";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Role, UserStatus } from "@/lib/supabase/types";

// All privileged user-account operations live here. These run server-side only
// (createServerFn handlers are stripped from the client bundle), so the
// service-role key never reaches the browser.

type CreatableRole = Exclude<Role, "admin">;

async function assertAdmin(token: string) {
  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("Sesi tidak sah. Sila log masuk semula.");
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    throw new Error("Hanya admin dibenarkan melakukan tindakan ini.");
  }
  return data.user;
}

function mapCreateError(message: string): never {
  const exists = /already|registered|exists/i.test(message);
  throw new Error(exists ? "Emel ini telah didaftarkan." : message);
}

/**
 * Public staff self-application. Creates a `pending` staff account (the trigger
 * sets status=pending from app_metadata.role='staff'). Does NOT sign anyone in.
 */
export const applyAsStaff = createServerFn({ method: "POST" })
  .validator(
    (d: { name: string; email: string; password: string; phone?: string }) => d,
  )
  .handler(async ({ data }) => {
    const admin = getAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email: data.email.trim(),
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, phone: data.phone ?? "" },
      app_metadata: { role: "staff" },
    });
    if (error) mapCreateError(error.message);
    return { ok: true as const };
  });

/**
 * Admin-created staff/anak accounts. Always `active`. Role is fixed server-side
 * from the (admin-only) request, never from client metadata.
 */
export const adminCreateUser = createServerFn({ method: "POST" })
  .validator(
    (d: {
      token: string;
      name: string;
      email: string;
      password: string;
      phone?: string;
      role: CreatableRole;
    }) => d,
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const admin = getAdminClient();

    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email.trim(),
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, phone: data.phone ?? "" },
      app_metadata: { role: data.role },
    });
    if (error || !created.user) mapCreateError(error?.message ?? "Gagal mencipta akaun.");

    // Trigger inserts a pending row for staff; force `active` for admin-created.
    const { error: pErr } = await admin.from("profiles").upsert({
      id: created!.user.id,
      name: data.name,
      email: data.email.trim(),
      role: data.role,
      status: "active",
      phone: data.phone ?? null,
    });
    if (pErr) throw new Error(pErr.message);

    return {
      id: created!.user.id,
      name: data.name,
      email: data.email.trim(),
      role: data.role,
      status: "active" as UserStatus,
      phone: data.phone || undefined,
    };
  });

/** Admin approve / reject / (de)activate a user. */
export const setUserStatus = createServerFn({ method: "POST" })
  .validator((d: { token: string; userId: string; status: UserStatus }) => d)
  .handler(async ({ data }) => {
    await assertAdmin(data.token);
    const admin = getAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const, userId: data.userId, status: data.status };
  });
