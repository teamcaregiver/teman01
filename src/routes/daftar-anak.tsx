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
import { PENEMPAH_KOSONG, semakPenempah, type MaklumatPenempah } from "@/lib/penempah";
import {
  PenempahIcField,
  PenempahKecemasanFields,
  PenempahMajikanFields,
} from "@/components/penempah-fields";

export const Route = createFileRoute("/daftar-anak")({
  head: () => ({ meta: [{ title: "Daftar Anak — Sistem Teman Malaysia" }] }),
  component: () => <RegisterForm role="anak" />,
});

export function RegisterForm({ role }: { role: "anak" | "staff" }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  // Booker details (issue #12) — family accounts only.
  const [penempah, setPenempah] = useState<MaklumatPenempah>(PENEMPAH_KOSONG);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const anak = role === "anak";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (anak) {
      const problem = semakPenempah(penempah, form.phone);
      if (problem) {
        toast.error(problem);
        return;
      }
    }
    setLoading(true);
    try {
      if (anak) {
        const res = await signUpAnak({ ...form, penempah });
        if (!res.ok) {
          toast.error(
            res.reason === "exists" ? "Emel ini telah didaftarkan." : res.message ?? "Pendaftaran gagal.",
          );
          return;
        }
        if (res.detailsSaved) {
          toast.success("Akaun anak berjaya didaftarkan");
        } else {
          toast.warning(
            "Akaun berjaya didaftarkan, tetapi sebahagian maklumat gagal disimpan. Sila lengkapkan di Profil Saya.",
          );
        }
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
            {anak ? "Daftar sebagai Anak" : "Daftar sebagai Temanion"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {anak
              ? "Buat akaun untuk baca artikel & video. Anda boleh tambah warga emas kemudian — tidak wajib semasa daftar."
              : "Permohonan anda akan disemak oleh admin sebelum aktif."}
          </p>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label>Nama Penuh{anak && " *"}</Label>
              <Input required placeholder="Nama anda" autoComplete="name" value={form.name} onChange={set("name")} />
            </div>
            {anak && <PenempahIcField value={penempah} onChange={setPenempah} />}
            <div className="space-y-1.5">
              <Label>No. Telefon{anak && " *"}</Label>
              <Input required type="tel" placeholder="012-3456789" autoComplete="tel" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Emel{anak && " *"}</Label>
              <Input required type="email" placeholder="nama@emel.com" autoComplete="email" value={form.email} onChange={set("email")} />
            </div>
            {anak && (
              <>
                <PenempahMajikanFields value={penempah} onChange={setPenempah} />
                <PenempahKecemasanFields value={penempah} onChange={setPenempah} />
                <div className="pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Akaun
                  </h3>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Kata Laluan{anak && " *"}</Label>
              <PasswordInput required placeholder="•••••••• (min. 6 aksara)" autoComplete="new-password" value={form.password} onChange={set("password")} />
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
