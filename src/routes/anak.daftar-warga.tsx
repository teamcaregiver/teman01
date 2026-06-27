import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parents } from "@/lib/mock-data";
import type { Parent } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/anak/daftar-warga")({
  component: RegisterParent,
});

// Same option sets as the Admin "Daftar Warga Emas" form so the two flows stay
// identical for the family (anak) user — the only difference is that there is
// no "akaun anak" section: the elderly is auto-linked to the logged-in anak.
const JENIS_DARAH = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUS_MOBILITI = [
  "Bebas Bergerak",
  "Perlu Bantuan",
  "Kerusi Roda",
  "Di Katil",
];
const STATUS_KOGNITIF = ["Normal", "Ringan", "Sederhana", "Teruk"];

function RegisterParent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string | null)?.trim() ?? "";

    // Auto-link the new elderly to the currently logged-in anak account.
    const newParent: Parent = {
      id: `p-${Date.now()}`,
      fullName: get("fullName"),
      ic: get("ic"),
      birthDate: get("birthDate"),
      gender: (get("gender") as "L" | "P") || "P",
      address: get("address"),
      phone: get("phone"),
      medicalCondition: get("medicalCondition"),
      medication: get("medication"),
      emergencyContact: get("emergencyContact"),
      relationship: get("relationship"),
      anakIds: user?.id ? [user.id] : [],
      jenisDarah: get("jenisDarah") || undefined,
      alahan: get("alahan") || undefined,
      namaDoktor: get("namaDoktor") || undefined,
      telDoktor: get("telDoktor") || undefined,
      hospitalRujukan: get("hospitalRujukan") || undefined,
      noInsurans: get("noInsurans") || undefined,
      statusMobiliti: get("statusMobiliti") || undefined,
      statusKognitif: get("statusKognitif") || undefined,
      sekatanPemakanan: get("sekatanPemakanan") || undefined,
    };
    parents.push(newParent);

    toast.success(
      "Warga emas berjaya didaftarkan dan dipautkan ke akaun anda.",
    );
    navigate({ to: "/anak" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Daftar Warga Emas</h1>
        <p className="text-sm text-muted-foreground">
          Daftarkan ibu / bapa / saudara tersayang. Maklumat akan dipautkan
          secara automatik ke akaun anda.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* === Maklumat Peribadi === */}
          <SectionCard title="Maklumat Peribadi">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Penuh *">
                <Input
                  name="fullName"
                  required
                  placeholder="Cth: Puan Mariam binti Hassan"
                />
              </Field>
              <Field label="No. IC *">
                <Input name="ic" required placeholder="510304-08-5432" />
              </Field>
              <Field label="Tarikh Lahir *">
                <Input name="birthDate" required type="date" />
              </Field>
              <Field label="Jantina *">
                <Select name="gender" defaultValue="P">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Lelaki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="No. Telefon *">
                <Input name="phone" required placeholder="03-2092 1122" />
              </Field>
              <Field label="Hubungan dengan Anda">
                <Input
                  name="relationship"
                  placeholder="Cth: Ibu / Ayah / Datuk"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Alamat *">
                  <Textarea
                    name="address"
                    rows={2}
                    required
                    placeholder="No. rumah, jalan, poskod, bandar"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* === Maklumat Perubatan === */}
          <SectionCard title="Maklumat Perubatan">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Jenis Darah">
                <Select name="jenisDarah">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis darah" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_DARAH.map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status Mobiliti">
                <Select name="statusMobiliti">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_MOBILITI.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status Kognitif">
                <Select name="statusKognitif">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_KOGNITIF.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="No. Insurans / Kad Kesihatan">
                <Input name="noInsurans" placeholder="Cth: PRU-12345 / MyKad" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Kondisi Perubatan *">
                  <Textarea
                    name="medicalCondition"
                    rows={2}
                    required
                    placeholder="Cth: Darah tinggi, diabetes jenis 2, sakit jantung"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Senarai Ubat & Dos">
                  <Textarea
                    name="medication"
                    rows={2}
                    placeholder="Cth: Metformin 500mg (pagi & malam), Amlodipine 5mg (pagi)"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Alahan (Ubat / Makanan / Lain)">
                  <Textarea
                    name="alahan"
                    rows={2}
                    placeholder="Cth: Alah kepada Penicillin, kacang tanah"
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Sekatan Pemakanan">
                  <Textarea
                    name="sekatanPemakanan"
                    rows={2}
                    placeholder="Cth: Rendah gula, rendah garam, tiada makanan laut"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* === Maklumat Doktor === */}
          <SectionCard title="Maklumat Doktor & Hospital">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Doktor">
                <Input
                  name="namaDoktor"
                  placeholder="Cth: Dr. Ahmad bin Ismail"
                />
              </Field>
              <Field label="No. Tel Doktor / Klinik">
                <Input name="telDoktor" placeholder="Cth: 03-1234 5678" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Hospital / Klinik Rujukan">
                  <Input
                    name="hospitalRujukan"
                    placeholder="Cth: Hospital Kuala Lumpur, Klinik Kesihatan Cheras"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* === Kontak Kecemasan === */}
          <SectionCard title="Kontak Kecemasan">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Kontak Kecemasan *">
                <Input
                  name="emergencyContact"
                  required
                  placeholder="Nama — No. telefon"
                />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: "/anak" })}
          >
            Batal
          </Button>
          <Button type="submit">Simpan & Daftar</Button>
        </div>
      </form>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 p-6">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
