import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { adminCreateUser } from "@/lib/admin-users";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/warga-emas/baru")({
  component: NewParent,
});

const JENIS_DARAH = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUS_MOBILITI = ["Bebas Bergerak", "Perlu Bantuan", "Kerusi Roda", "Di Katil"];
const STATUS_KOGNITIF = ["Normal", "Ringan", "Sederhana", "Teruk"];

function NewParent() {
  const navigate = useNavigate();
  const [createAnak, setCreateAnak] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: anakOptions = [] } = useQuery({
    queryKey: ["anak-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name")
        .eq("role", "anak")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string | null)?.trim() ?? "";
    setSaving(true);
    try {
      // 1) Resolve the anak account (create a new one, or link an existing one).
      let anakId: string | null = null;
      if (createAnak) {
        const created = await adminCreateUser({
          name: get("anakName"),
          email: get("anakEmail"),
          phone: get("anakPhone"),
          password: get("anakPassword"),
          role: "anak",
        });
        anakId = created.id;
      } else {
        anakId = get("linkAnakId") || null;
      }

      // 2) Insert the elderly profile (admin RLS allows this).
      const { data: parent, error } = await supabase
        .from("parents")
        .insert({
          full_name: get("fullName"),
          ic: get("ic"),
          birth_date: get("birthDate") || null,
          gender: (get("gender") as "L" | "P") || "P",
          address: get("address"),
          phone: get("phone"),
          medical_condition: get("medicalCondition"),
          medication: get("medication"),
          emergency_contact: get("emergencyContact"),
          relationship: get("relationship"),
          jenis_darah: get("jenisDarah") || null,
          status_mobiliti: get("statusMobiliti") || null,
          status_kognitif: get("statusKognitif") || null,
          no_insurans: get("noInsurans") || null,
          alahan: get("alahan") || null,
          sekatan_pemakanan: get("sekatanPemakanan") || null,
          nama_doktor: get("namaDoktor") || null,
          tel_doktor: get("telDoktor") || null,
          hospital_rujukan: get("hospitalRujukan") || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      // 3) Link elderly <-> anak.
      if (anakId && parent) {
        const { error: linkErr } = await supabase
          .from("parent_anak")
          .insert({ parent_id: parent.id, anak_id: anakId });
        if (linkErr) throw linkErr;
      }

      toast.success("Warga emas berjaya didaftarkan");
      navigate({ to: "/admin/warga-emas" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar warga emas.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Daftar Warga Emas</h1>
        <p className="text-sm text-muted-foreground">Isi maklumat lengkap dan pautkan kepada akaun anak.</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* === Maklumat Peribadi === */}
          <SectionCard title="Maklumat Peribadi">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Penuh *"><Input name="fullName" required placeholder="Cth: Puan Mariam binti Hassan" /></Field>
              <Field label="No. IC *"><Input name="ic" required placeholder="510304-08-5432" /></Field>
              <Field label="Tarikh Lahir *"><Input name="birthDate" required type="date" /></Field>
              <Field label="Jantina *">
                <Select name="gender" defaultValue="P">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Lelaki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="No. Telefon *"><Input name="phone" required placeholder="03-2092 1122" /></Field>
              <Field label="Hubungan dengan Anak"><Input name="relationship" placeholder="Cth: Ibu / Ayah / Datuk" /></Field>
              <div className="md:col-span-2">
                <Field label="Alamat *"><Textarea name="address" rows={2} required placeholder="No. rumah, jalan, poskod, bandar" /></Field>
              </div>
            </div>
          </SectionCard>

          {/* === Maklumat Perubatan === */}
          <SectionCard title="Maklumat Perubatan">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Jenis Darah">
                <Select name="jenisDarah">
                  <SelectTrigger><SelectValue placeholder="Pilih jenis darah" /></SelectTrigger>
                  <SelectContent>
                    {JENIS_DARAH.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status Mobiliti">
                <Select name="statusMobiliti">
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_MOBILITI.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status Kognitif">
                <Select name="statusKognitif">
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_KOGNITIF.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="No. Insurans / Kad Kesihatan"><Input name="noInsurans" placeholder="Cth: PRU-12345 / MyKad" /></Field>
              <div className="md:col-span-2">
                <Field label="Kondisi Perubatan *">
                  <Textarea name="medicalCondition" rows={2} required placeholder="Cth: Darah tinggi, diabetes jenis 2, sakit jantung" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Senarai Ubat & Dos">
                  <Textarea name="medication" rows={2} placeholder="Cth: Metformin 500mg (pagi & malam), Amlodipine 5mg (pagi)" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Alahan (Ubat / Makanan / Lain)">
                  <Textarea name="alahan" rows={2} placeholder="Cth: Alah kepada Penicillin, kacang tanah" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Sekatan Pemakanan">
                  <Textarea name="sekatanPemakanan" rows={2} placeholder="Cth: Rendah gula, rendah garam, tiada makanan laut" />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* === Maklumat Doktor === */}
          <SectionCard title="Maklumat Doktor & Hospital">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Doktor"><Input name="namaDoktor" placeholder="Cth: Dr. Ahmad bin Ismail" /></Field>
              <Field label="No. Tel Doktor / Klinik"><Input name="telDoktor" placeholder="Cth: 03-1234 5678" /></Field>
              <div className="md:col-span-2">
                <Field label="Hospital / Klinik Rujukan">
                  <Input name="hospitalRujukan" placeholder="Cth: Hospital Kuala Lumpur, Klinik Kesihatan Cheras" />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* === Kontak Kecemasan & Penugasan === */}
          <SectionCard title="Kontak Kecemasan & Akaun Anak">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Kontak Kecemasan *"><Input name="emergencyContact" required placeholder="Nama — No. telefon" /></Field>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1" checked={createAnak} onChange={(e) => setCreateAnak(e.target.checked)} />
                <div>
                  <p className="text-sm font-medium">Daftar akaun Anak sekali</p>
                  <p className="text-xs text-muted-foreground">Pilih jika anak belum ada akaun dalam sistem.</p>
                </div>
              </label>
              {createAnak ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Nama Anak *"><Input name="anakName" required /></Field>
                  <Field label="Emel Anak *"><Input name="anakEmail" required type="email" /></Field>
                  <Field label="No. Telefon Anak"><Input name="anakPhone" /></Field>
                  <Field label="Kata Laluan Sementara *"><PasswordInput name="anakPassword" required /></Field>
                </div>
              ) : (
                <div className="mt-4">
                  <Field label="Pautkan kepada Anak Sedia Ada">
                    <Select name="linkAnakId">
                      <SelectTrigger><SelectValue placeholder="Pilih anak" /></SelectTrigger>
                      <SelectContent>
                        {anakOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/admin/warga-emas" })}>Batal</Button>
          <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan & Daftar"}</Button>
        </div>
      </form>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 p-6">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      {children}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
