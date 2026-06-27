import { useEffect, useState } from "react";
import type { Role, User } from "./mock-data";
import { users } from "./mock-data";

const KEY = "ecare.auth";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function signInAs(role: Role): User {
  const u = users.find((x) => x.role === role && x.status === "active")!;
  localStorage.setItem(KEY, JSON.stringify(u));
  return u;
}

export const DEMO_CREDENTIALS: { role: Role; email: string; password: string; label: string }[] = [
  { role: "admin", email: "admin@care.my", password: "admin123", label: "Admin" },
  { role: "staff", email: "nurul@care.my", password: "staff123", label: "Staf / Penjaga" },
  { role: "anak", email: "aisha@mail.my", password: "anak123", label: "Anak / Keluarga" },
];

export function signInWithEmail(email: string, password: string): User | null {
  const cred = DEMO_CREDENTIALS.find(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password,
  );
  if (!cred) return null;
  const u = users.find((x) => x.email === cred.email && x.status === "active");
  if (!u) return null;
  localStorage.setItem(KEY, JSON.stringify(u));
  return u;
}

export function signOut() {
  localStorage.removeItem(KEY);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(getCurrentUser());
    setReady(true);
    const onStorage = () => setUser(getCurrentUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { user, ready, refresh: () => setUser(getCurrentUser()) };
}
