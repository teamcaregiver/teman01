// Privileged user-account operations, moved out of the (now static) SPA.
//
// In the old SSR build these lived in `src/lib/admin-users.ts` as
// `createServerFn` handlers. A GitHub Pages SPA has no server, so they run
// here as a Supabase Edge Function instead. The service-role key never leaves
// the server — it's injected by Supabase as SUPABASE_SERVICE_ROLE_KEY.
//
// Deploy:  supabase functions deploy admin-users --no-verify-jwt
// (--no-verify-jwt is required because `applyAsStaff` is called by anonymous
//  visitors whose Authorization header carries the publishable key, not a JWT.
//  We do our own admin check below for the privileged actions.)

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Validate that the caller (from the request's bearer token) is an admin.
async function assertAdmin(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new Error("Sesi tidak sah. Sila log masuk semula.");

  const admin = adminClient();
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action as string | undefined;
  const admin = adminClient();

  try {
    switch (action) {
      // Public staff self-application — creates a `pending` staff account.
      // The DB trigger sets status=pending from app_metadata.role='staff'.
      case "applyAsStaff": {
        const { name, email, password, phone } = body as {
          name: string; email: string; password: string; phone?: string;
        };
        const { error } = await admin.auth.admin.createUser({
          email: String(email).trim(),
          password,
          email_confirm: true,
          user_metadata: { name, phone: phone ?? "" },
          app_metadata: { role: "staff" },
        });
        if (error) mapCreateError(error.message);
        return json({ ok: true });
      }

      // Admin-created staff/anak account — always `active`. Role is fixed
      // server-side from the (admin-only) request, never from client metadata.
      case "adminCreateUser": {
        await assertAdmin(req);
        const { name, email, password, phone, role } = body as {
          name: string; email: string; password: string;
          phone?: string; role: "staff" | "anak";
        };
        if (role !== "staff" && role !== "anak") {
          return json({ error: "Peranan tidak sah." }, 400);
        }

        const { data: created, error } = await admin.auth.admin.createUser({
          email: String(email).trim(),
          password,
          email_confirm: true,
          user_metadata: { name, phone: phone ?? "" },
          app_metadata: { role },
        });
        if (error || !created.user) {
          mapCreateError(error?.message ?? "Gagal mencipta akaun.");
        }

        // Trigger inserts a pending row for staff; force `active` here.
        const { error: pErr } = await admin.from("profiles").upsert({
          id: created!.user.id,
          name,
          email: String(email).trim(),
          role,
          status: "active",
          phone: phone ?? null,
        });
        if (pErr) throw new Error(pErr.message);

        return json({
          id: created!.user.id,
          name,
          email: String(email).trim(),
          role,
          status: "active",
          phone: phone || undefined,
        });
      }

      // Admin approve / reject / (de)activate a user.
      case "setUserStatus": {
        await assertAdmin(req);
        const { userId, status } = body as { userId: string; status: string };
        const { error } = await admin
          .from("profiles")
          .update({ status })
          .eq("id", userId);
        if (error) throw new Error(error.message);
        return json({ ok: true, userId, status });
      }

      default:
        return json({ error: `Unknown action: ${action ?? "(none)"}` }, 400);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Ralat pelayan." }, 400);
  }
});
