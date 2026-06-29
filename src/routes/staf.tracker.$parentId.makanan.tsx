import {
  createFileRoute,
  useParams,
  useNavigate,
  Link,
} from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KUANTITI_OPTIONS } from "@/lib/mock-data";
import type { Kuantiti, MakananEntry } from "@/lib/mock-data";
import { addMakananEntry } from "@/lib/tracker-actions";
import { useParents, useInvalidate, qk } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { NowStamp } from "@/components/now-stamp";

export const Route = createFileRoute("/staf/tracker/$parentId/makanan")({
  component: MakananForm,
});

function num(s: string): number | undefined {
  const n = Number(s);
  return s !== "" && !Number.isNaN(n) ? n : undefined;
}

function MakananForm() {
  const { parentId } = useParams({ from: "/staf/tracker/$parentId/makanan" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const parents = useParents();
  const invalidate = useInvalidate();
  const parent = parents.find((p) => p.id === parentId);

  const [jenisMakanan, setJenisMakanan] = useState("");
  const [jenisMinum, setJenisMinum] = useState("");
  const [kuantiti, setKuantiti] = useState<Kuantiti | "">("");
  const [cecairMl, setCecairMl] = useState("");
  const [catatan, setCatatan] = useState("");

  if (!parent)
    return <p>{parents.length === 0 ? "Memuatkan…" : "Warga emas tidak dijumpai."}</p>;

  const back = () =>
    navigate({ to: "/staf/tracker/$parentId", params: { parentId } });

  const submit = async () => {
    if (!jenisMakanan && !jenisMinum && !kuantiti && !cecairMl) {
      toast.error("Isi sekurang-kurangnya satu maklumat");
      return;
    }
    const entry: MakananEntry = {
      masa: new Date().toISOString(),
      jenisMakanan: jenisMakanan || undefined,
      jenisMinum: jenisMinum || undefined,
      kuantiti: kuantiti || undefined,
      cecairMl: num(cecairMl),
      catatan: catatan || undefined,
      pengesahan: user?.name ?? "",
    };
    try {
      await addMakananEntry(parentId, user?.id ?? "", entry);
      invalidate(qk.trackers);
      toast.success("Makanan & minuman direkod");
      back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan rekod");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        to="/staf/tracker/$parentId"
        params={{ parentId }}
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Rekod Harian
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold">
          Rekod Makanan & Minuman
        </h1>
        <p className="text-sm text-muted-foreground">
          Untuk:{" "}
          <span className="font-medium text-foreground">{parent.fullName}</span>{" "}
          · Masa direkod automatik bila disimpan.
        </p>
      </div>

      <NowStamp />

      <Card className="border-border/60 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jenis Makanan">
            <Input
              value={jenisMakanan}
              onChange={(e) => setJenisMakanan(e.target.value)}
              placeholder="Cth: Bubur ayam"
            />
          </Field>
          <Field label="Jenis Minuman">
            <Input
              value={jenisMinum}
              onChange={(e) => setJenisMinum(e.target.value)}
              placeholder="Cth: Air kosong"
            />
          </Field>
          <Field label="Kuantiti">
            <Select
              value={kuantiti}
              onValueChange={(v) => setKuantiti(v as Kuantiti)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kuantiti" />
              </SelectTrigger>
              <SelectContent>
                {KUANTITI_OPTIONS.map((k) => (
                  <SelectItem key={k.key} value={k.key}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pengambilan Cecair (ml)">
            <Input
              inputMode="numeric"
              value={cecairMl}
              onChange={(e) => setCecairMl(e.target.value)}
              placeholder="Cth: 200"
            />
          </Field>
          <div className="col-span-2">
            <Field label="Catatan">
              <Input
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Pilihan"
              />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={back}>
          Batal
        </Button>
        <Button type="button" onClick={submit}>
          Simpan Rekod
        </Button>
      </div>
    </div>
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
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
