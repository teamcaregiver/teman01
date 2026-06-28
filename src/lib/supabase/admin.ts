import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// SERVER-ONLY. This module reads the service-role secret and must never be
// imported by client code — only by TanStack Start server functions
// (createServerFn handlers), which are stripped from the client bundle.

let cached: SupabaseClient<Database> | null = null;

function readSecret(): { url: string; secret: string } {
  // Nitro loads .env into process.env in dev; in prod the host provides them.
  const url =
    process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.secret_key ?? "";
  if (!url || !secret) {
    throw new Error(
      "Missing server Supabase env vars: SUPABASE_SECRET_KEY and VITE_SUPABASE_URL must be set.",
    );
  }
  return { url, secret };
}

/** Service-role client that bypasses RLS. Use only after authorizing the caller. */
export function getAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const { url, secret } = readSecret();
  cached = createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
