import { supabase } from "@/lib/supabase/client";
import type { Role, UserStatus } from "@/lib/supabase/types";

// Client-side wrappers around the `admin-users` Supabase Edge Function.
// Privileged work (service-role key, user creation, role assignment) happens
// in the function — see supabase/functions/admin-users/index.ts. The logged-in
// user's JWT is attached automatically by supabase.functions.invoke, so the
// function can verify admin rights for the privileged actions.

type CreatableRole = Exclude<Role, "admin">;

async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) {
    // Non-2xx responses surface as FunctionsHttpError; the JSON body
    // ({ error: "..." }) lives on error.context (a Response).
    let message = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const parsed = await ctx.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        /* fall back to error.message */
      }
    }
    throw new Error(message);
  }
  if (data && typeof data === "object" && "error" in data) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

/** Public staff self-application. Creates a `pending` staff account. */
export function applyAsStaff(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  return invokeAdmin<{ ok: true }>({ action: "applyAsStaff", ...input });
}

/** Admin-created staff/anak account. Always `active`; role fixed server-side. */
export function adminCreateUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: CreatableRole;
}) {
  return invokeAdmin<{
    id: string;
    name: string;
    email: string;
    role: CreatableRole;
    status: UserStatus;
    phone?: string;
  }>({ action: "adminCreateUser", ...input });
}

/** Admin approve / reject / (de)activate a user. */
export function setUserStatus(input: { userId: string; status: UserStatus }) {
  return invokeAdmin<{ ok: true; userId: string; status: UserStatus }>({
    action: "setUserStatus",
    ...input,
  });
}
