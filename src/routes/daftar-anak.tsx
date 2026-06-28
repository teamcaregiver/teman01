import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signUpAnak } from "@/lib/auth-store";
import { applyAsStaff } from "@/lib/admin-users";

export const Route = createFileRoute("/daftar-anak")({
  head: () => ({ meta: [{ title: "Daftar Anak — CareSenior" }] }),
  component: () => <RegisterForm role="anak" />,
});

export function RegisterForm({ role }: { role: "anak" | "staff" }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === "anak") {
        const res = await signUpAnak(form);
        if (!res.ok) {
          toast.error(
            res.reason === "exists" ? "Emel ini telah didaftarkan." : res.message ?? "Pendaftaran gagal.",
          );
          return;
        }
        toast.success("Akaun anak berjaya didaftarkan");
        navigate({ to: "/anak" });
      } else {
        await applyAsStaff(form);
        toast.success("Permohonan dihantar. Menunggu kelulusan admin.");
        navigate({ to: "/login" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-md">
        <Card className="border-border/60 p-6 shadow-card">
          <h1 className="font-display text-2xl font-bold">
            {role === "anak" ? "Daftar sebagai Anak" : "Daftar sebagai Staf"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "anak"
              ? "Buat akaun untuk baca artikel & video. Anda boleh tambah warga emas kemudian — tidak wajib semasa daftar."
              : "Permohonan anda akan disemak oleh admin sebelum aktif."}
          </p>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label>Nama Penuh</Label>
              <Input required placeholder="Nama anda" value={form.name} onChange={set("name")} />
            </div>
            <div className="space-y-1.5">
              <Label>Emel</Label>
              <Input required type="email" placeholder="nama@emel.com" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-1.5">
              <Label>No. Telefon</Label>
              <Input required placeholder="012-3456789" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Kata Laluan</Label>
              <PasswordInput required placeholder="•••••••• (min. 6 aksara)" value={form.password} onChange={set("password")} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : role === "anak" ? "Daftar & Masuk" : "Hantar Permohonan"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Sudah ada akaun?{" "}
              <Link to="/login" className="text-primary underline-offset-2 hover:underline">
                Log masuk
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
