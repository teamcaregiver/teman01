import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { signInAs } from "@/lib/auth-store";

export const Route = createFileRoute("/daftar-anak")({
  head: () => ({ meta: [{ title: "Daftar Anak — CareSenior" }] }),
  component: () => <RegisterForm role="anak" />,
});

export function RegisterForm({ role }: { role: "anak" | "staff" }) {
  const navigate = useNavigate();
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
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (role === "anak") {
                signInAs("anak");
                toast.success("Akaun anak berjaya didaftarkan");
                navigate({ to: "/anak" });
              } else {
                toast.success("Permohonan dihantar. Menunggu kelulusan admin.");
                navigate({ to: "/login" });
              }
            }}
          >
            <div className="space-y-1.5">
              <Label>Nama Penuh</Label>
              <Input required placeholder="Nama anda" />
            </div>
            <div className="space-y-1.5">
              <Label>Emel</Label>
              <Input required type="email" placeholder="nama@emel.com" />
            </div>
            <div className="space-y-1.5">
              <Label>No. Telefon</Label>
              <Input required placeholder="012-3456789" />
            </div>
            <div className="space-y-1.5">
              <Label>Kata Laluan</Label>
              <Input required type="password" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full">
              {role === "anak" ? "Daftar & Masuk" : "Hantar Permohonan"}
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
