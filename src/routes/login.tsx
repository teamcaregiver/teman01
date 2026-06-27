import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Copy, LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_CREDENTIALS, signInWithEmail } from "@/lib/auth-store";
import type { Role } from "@/lib/mock-data";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log Masuk — CareSenior" }] }),
  component: LoginPage,
});

function routeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "staff" ? "/staf" : "/anak";
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const u = signInWithEmail(email, password);
      setLoading(false);
      if (!u) {
        toast.error("Emel atau kata laluan salah");
        return;
      }
      toast.success(`Selamat datang, ${u.name}`);
      navigate({ to: routeFor(u.role) });
    }, 250);
  };

  const fill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Disalin");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-10 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-primary" /> Sistem Penjagaan Warga Emas
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
            Penjagaan dengan{" "}
            <span className="bg-gradient-to-r from-primary to-[color:var(--teal-foreground)] bg-clip-text text-transparent">
              ketenangan
            </span>
            .
          </h1>
          <p className="max-w-md text-muted-foreground">
            Pantau kesihatan harian, urus pasukan penjaga, dan kekal berhubung dengan orang tersayang dalam satu platform yang lembut dan boleh dipercayai.
          </p>

          <Card className="border-border/60 bg-card/60 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Akaun Demo
            </p>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((c) => (
                <div
                  key={c.role}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold">{c.label}</p>
                    <p className="truncate text-muted-foreground">
                      {c.email} · {c.password}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copy(`${c.email} / ${c.password}`)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => fill(c.email, c.password)}>
                      Guna
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-border/60 p-6 shadow-card">
            <h2 className="font-display text-xl font-bold">Log Masuk</h2>
            <p className="text-sm text-muted-foreground">
              Masukkan emel dan kata laluan akaun anda.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Emel</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="nama@care.my"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata Laluan</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Memproses..." : "Log Masuk"}
              </Button>
            </form>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <span>Belum ada akaun?</span>
              <div className="flex gap-2">
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate({ to: "/daftar-anak" })}>
                  Daftar sebagai Anak
                </Button>
                <span>·</span>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate({ to: "/daftar-staff" })}>
                  Daftar sebagai Staf
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
