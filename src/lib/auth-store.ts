import { useEffect, useState } from "react";
import type { Role, User } from "./mock-data";
import { supabase } from "./supabase/client";
import type { ProfileRow } from "./supabase/types";

const KEY = "ecare.auth";

// ---- cached profile (keeps route `beforeLoad` guards synchronous) ----
function cacheUser(u: User | null) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(KEY, JSON.stringify(u));
  else localStorage.removeItem(KEY);
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function rowToUser(p: ProfileRow): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role as Role,
    status: p.status,
    phone: p.phone ?? undefined,
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,email,role,status,phone,created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToUser(data as ProfileRow);
}

/** Access token for the current session, to authorize server-function calls. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ---- results ----
export type SignInResult =
  | { ok: true; user: User }
  | { ok: false; reason: "invalid" | "pending" | "blocked"; message?: string };

export type SignUpResult =
  | { ok: true; user: User }
  | { ok: false; reason: "exists" | "error"; message?: string };

export const DEMO_CREDENTIALS: {
  role: Role;
  email: string;
  password: string;
  label: string;
}[] = [
  { role: "admin", email: "admin@care.my", password: "admin123", label: "Admin" },
  { role: "staff", email: "nurul@care.my", password: "staff123", label: "Staf / Penjaga" },
  { role: "anak", email: "aisha@mail.my", password: "anak123", label: "Anak / Keluarga" },
];

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<SignInResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.user) return { ok: false, reason: "invalid" };

  const profile = await fetchProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, reason: "invalid" };
  }
  if (profile.status !== "active") {
    await supabase.auth.signOut();
    cacheUser(null);
    return {
      ok: false,
      reason: profile.status === "pending" ? "pending" : "blocked",
    };
  }
  cacheUser(profile);
  return { ok: true, user: profile };
}

/** Public anak self-registration. Role is forced to 'anak' by the DB trigger. */
export async function signUpAnak(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { name: input.name, phone: input.phone } },
  });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return { ok: false, reason: exists ? "exists" : "error", message: error.message };
  }
  if (!data.session || !data.user) {
    // No session => email confirmation is still ON in the project settings.
    return {
      ok: false,
      reason: "error",
      message:
        "Sahkan emel anda dahulu, atau matikan 'Confirm email' dalam tetapan Supabase Auth.",
    };
  }
  // Trigger creates the profile in the same transaction; retry once for safety.
  let profile = await fetchProfile(data.user.id);
  if (!profile) {
    await new Promise((r) => setTimeout(r, 350));
    profile = await fetchProfile(data.user.id);
  }
  if (!profile) return { ok: false, reason: "error", message: "Profil tidak dijumpai." };
  cacheUser(profile);
  return { ok: true, user: profile };
}

export async function signOut() {
  cacheUser(null); // clear synchronously so guards see logout immediately
  await supabase.auth.signOut();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        const p = await fetchProfile(data.session.user.id);
        if (!mounted) return;
        cacheUser(p);
        setUser(p);
      } else {
        cacheUser(null);
        setUser(null);
      }
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer DB work out of the callback to avoid the supabase-js lock deadlock.
      setTimeout(async () => {
        if (!mounted) return;
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          if (!mounted) return;
          cacheUser(p);
          setUser(p);
        } else {
          cacheUser(null);
          setUser(null);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, ready, refresh: () => setUser(getCurrentUser()) };
}
