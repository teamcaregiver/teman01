import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase/client";
import { useParentQuery, useInvalidate, qk } from "@/lib/data";
import {
  RELATIONSHIP_OPTIONS,
  RELATIONSHIP_OTHER,
  joinRelationship,
  splitRelationship,
} from "@/lib/relationship";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/admin/warga-emas/$parentId/edit")({
  component: EditParent,
});

const JENIS_DARAH = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUS_MOBILITI = ["Bebas Bergerak", "Perlu Bantuan", "Kerusi Roda", "Di Katil"];
const STATUS_KOGNITIF = ["Normal", "Ringan", "Sederhana", "Teruk"];

type FormState = {
  fullName: string;
  ic: string;
  birthDate: string;
  gender: "L" | "P";
  phone: string;
  address: string;
  relationship: string;
  relationshipOther: string;
  jenisDarah: string;
  statusMobiliti: string;
  statusKognitif: string;
  noInsurans: string;
  medicalCondition: string;
  medication: string;
  alahan: string;
  sekatanPemakanan: string;
  namaDoktor: string;
  telDoktor: string;
  hospitalRujukan: string;
  emergencyContact: string;
};

function EditParent() {
  const { parentId } = useParams({ from: "/admin/warga-emas/$parentId/edit" });
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const parentQ = useParentQuery(parentId);

  const [form, setForm] = useState<FormState | null>(null);
  const [linkedAnak, setLinkedAnak] = useState<string[]>([]);
  const [originalAnak, setOriginalAnak] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const { data: anakOptions = [] } = useQuery({
    queryKey: ["anak-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,email")
        .eq("role", "anak")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Prefill once the resident is loaded.
  const parent = parentQ.data ?? null;
  useEffect(() => {
    if (!parent) return;
    const rel = splitRelationship(parent.relationship);
    setForm({
      fullName: parent.fullName,
      ic: parent.ic,
      // <input type="date"> needs a bare yyyy-mm-dd value.
      birthDate: parent.birthDate ? parent.birthDate.slice(0, 10) : "",
      gender: parent.gender,
      phone: parent.phone ?? "",
      address: parent.address ?? "",
      relationship: rel.option,
      relationshipOther: rel.other,
      jenisDarah: parent.jenisDarah ?? "",
      statusMobiliti: parent.statusMobiliti ?? "",
      statusKognitif: parent.statusKognitif ?? "",
      noInsurans: parent.noInsurans ?? "",
      medicalCondition: parent.medicalCondition ?? "",
      medication: parent.medication ?? "",
      alahan: parent.alahan ?? "",
      sekatanPemakanan: parent.sekatanPemakanan ?? "",
      namaDoktor: parent.namaDoktor ?? "",
      telDoktor: parent.telDoktor ?? "",
      hospitalRujukan: parent.hospitalRujukan ?? "",
      emergencyContact: parent.emergencyContact ?? "",
    });
    setLinkedAnak(parent.anakIds);
    setOriginalAnak(parent.anakIds);
    setDirty(false);
  }, [parent]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setDirty(true);
  };

  const toggleAnak = (id: string) => {
    setLinkedAnak((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    setDirty(true);
  };

  const backToDetail = () => navigate({ to: "/admin/warga-emas/$parentId", params: { parentId } });
  const requestBack = () => (dirty ? setConfirmLeave(true) : backToDetail());

  const anakDiff = useMemo(() => {
    const toAdd = linkedAnak.filter((id) => !originalAnak.includes(id));
    const toRemove = originalAnak.filter((id) => !linkedAnak.includes(id));
    return { toAdd, toRemove };
  }, [linkedAnak, originalAnak]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form) return;

    const required: [string, string][] = [
      ["Nama Penuh", form.fullName],
      ["No. IC", form.ic],
      ["Tarikh Lahir", form.birthDate],
      ["No. Telefon", form.phone],
      ["Alamat", form.address],
      ["Kondisi Perubatan", form.medicalCondition],
      ["Kontak Kecemasan", form.emergencyContact],
    ];
    const missing = required.find(([, v]) => !v.trim());
    if (missing) {
      toast.error(`Sila isi ruangan ${missing[0]}.`);
      return;
    }
    if (form.relationship === RELATIONSHIP_OTHER && !form.relationshipOther.trim()) {
      toast.error("Sila nyatakan hubungan.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("parents")
        .update({
          full_name: form.fullName.trim(),
          ic: form.ic.trim(),
          birth_date: form.birthDate || null,
          gender: form.gender,
          address: form.address.trim(),
          phone: form.phone.trim(),
          medical_condition: form.medicalCondition.trim(),
          medication: form.medication.trim(),
          emergency_contact: form.emergencyContact.trim(),
          relationship: joinRelationship(form.relationship, form.relationshipOther),
          jenis_darah: form.jenisDarah || null,
          status_mobiliti: form.statusMobiliti || null,
          status_kognitif: form.statusKognitif || null,
          no_insurans: form.noInsurans.trim() || null,
          alahan: form.alahan.trim() || null,
          sekatan_pemakanan: form.sekatanPemakanan.trim() || null,
          nama_doktor: form.namaDoktor.trim() || null,
          tel_doktor: form.telDoktor.trim() || null,
          hospital_rujukan: form.hospitalRujukan.trim() || null,
        })
        .eq("id", parentId);
      if (error) throw error;

      // Sync the linked-child rows to match the checkboxes.
      if (anakDiff.toRemove.length) {
        const { error: delErr } = await supabase
          .from("parent_anak")
          .delete()
          .eq("parent_id", parentId)
          .in("anak_id", anakDiff.toRemove);
        if (delErr) throw delErr;
      }
      if (anakDiff.toAdd.length) {
        const { error: insErr } = await supabase
          .from("parent_anak")
          .insert(anakDiff.toAdd.map((anak_id) => ({ parent_id: parentId, anak_id })));
        if (insErr) throw insErr;
      }

      setDirty(false);
      invalidate(qk.parents);
      toast.success("Maklumat warga emas berjaya dikemas kini");
      navigate({ to: "/admin/warga-emas/$parentId", params: { parentId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengemas kini maklumat.");
    } finally {
      setSaving(false);
    }
  }

  if (parentQ.isPending || (parent && !form)) return <EditSkeleton />;

  if (parentQ.isError)
    return (
      <StatusPanel
        title="Gagal memuatkan maklumat"
        hint={(parentQ.error as Error).message}
        action={<Button variant="outline" size="sm" onClick={() => void parentQ.refetch()}>Cuba lagi</Button>}
      />
    );

  if (!parent || !form)
    return (
      <StatusPanel
        title="Warga emas tidak dijumpai"
        hint="Rekod ini mungkin telah dipadam atau pautan tidak sah."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/warga-emas">Kembali ke senarai</Link>
          </Button>
        }
      />
    );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={requestBack}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> Kembali ke profil
      </Button>

      <div>
        <h1 className="font-display text-2xl font-bold">Edit Warga Emas</h1>
        <p className="text-sm text-muted-foreground">
          Kemas kini maklumat {parent.fullName}.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* === Maklumat Peribadi === */}
          <SectionCard title="Maklumat Peribadi">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Penuh *">
                <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
              </Field>
              <Field label="No. IC *">
                <Input value={form.ic} onChange={(e) => set("ic", e.target.value)} />
              </Field>
              <Field label="Tarikh Lahir *">
                <Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
              </Field>
              <Field label="Jantina *">
                <Select value={form.gender} onValueChange={(v) => set("gender", v as "L" | "P")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Lelaki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="No. Telefon *">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Hubungan dengan Anak">
                <Select value={form.relationship} onValueChange={(v) => set("relationship", v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih hubungan" /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                    <SelectItem value={RELATIONSHIP_OTHER}>{RELATIONSHIP_OTHER}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {form.relationship === RELATIONSHIP_OTHER && (
                <div className="md:col-span-2">
                  <Field label="Nyatakan Hubungan *">
                    <Input
                      value={form.relationshipOther}
                      onChange={(e) => set("relationshipOther", e.target.value)}
                      placeholder="Cth: Jiran, penjaga sah"
                    />
                  </Field>
                </div>
              )}
              <div className="md:col-span-2">
                <Field label="Alamat *">
                  <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* === Maklumat Perubatan === */}
          <SectionCard title="Maklumat Perubatan">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Jenis Darah">
                <Select value={form.jenisDarah} onValueChange={(v) => set("jenisDarah", v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih jenis darah" /></SelectTrigger>
                  <SelectContent>
                    {JENIS_DARAH.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status Mobiliti">
                <Select value={form.statusMobiliti} onValueChange={(v) => set("statusMobiliti", v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_MOBILITI.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status Kognitif">
                <Select value={form.statusKognitif} onValueChange={(v) => set("statusKognitif", v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_KOGNITIF.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="No. Insurans / Kad Kesihatan">
                <Input value={form.noInsurans} onChange={(e) => set("noInsurans", e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Kondisi Perubatan *">
                  <Textarea rows={2} value={form.medicalCondition} onChange={(e) => set("medicalCondition", e.target.value)} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Senarai Ubat & Dos">
                  <Textarea rows={2} value={form.medication} onChange={(e) => set("medication", e.target.value)} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Alahan (Ubat / Makanan / Lain)">
                  <Textarea rows={2} value={form.alahan} onChange={(e) => set("alahan", e.target.value)} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Sekatan Pemakanan">
                  <Textarea rows={2} value={form.sekatanPemakanan} onChange={(e) => set("sekatanPemakanan", e.target.value)} />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* === Maklumat Doktor === */}
          <SectionCard title="Maklumat Doktor & Hospital">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama Doktor">
                <Input value={form.namaDoktor} onChange={(e) => set("namaDoktor", e.target.value)} />
              </Field>
              <Field label="No. Tel Doktor / Klinik">
                <Input value={form.telDoktor} onChange={(e) => set("telDoktor", e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Hospital / Klinik Rujukan">
                  <Input value={form.hospitalRujukan} onChange={(e) => set("hospitalRujukan", e.target.value)} />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* === Kontak Kecemasan & Anak Terpaut === */}
          <SectionCard title="Kontak Kecemasan & Akaun Anak">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Kontak Kecemasan *">
                <Input
                  value={form.emergencyContact}
                  onChange={(e) => set("emergencyContact", e.target.value)}
                  placeholder="Nama — No. telefon"
                />
              </Field>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium">Anak Terpaut</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tandakan akaun anak yang boleh melihat rekod warga emas ini.
              </p>
              {anakOptions.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Tiada akaun anak berdaftar dalam sistem.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {anakOptions.map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-card p-2.5 text-sm ring-1 ring-inset ring-border/60"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={linkedAnak.includes(a.id)}
                        onChange={() => toggleAnak(a.id)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{a.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={requestBack} disabled={saving}>Batal</Button>
          <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button>
        </div>
      </form>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buang perubahan yang belum disimpan?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda telah mengubah maklumat {parent.fullName} tetapi belum
              menyimpannya. Jika anda keluar sekarang, perubahan tersebut akan
              hilang dan rekod asal kekal seperti sedia ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Teruskan Mengedit</AlertDialogCancel>
            <AlertDialogAction onClick={backToDetail}>Keluar Tanpa Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function EditSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

function StatusPanel({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-3xl border-border/60 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
