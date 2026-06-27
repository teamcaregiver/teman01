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
import { parents, computeVitalStatus } from "@/lib/mock-data";
import type { VitalEntry } from "@/lib/mock-data";
import { addVitalEntry } from "@/lib/tracker-actions";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { NowStamp } from "@/components/now-stamp";

export const Route = createFileRoute("/staf/tracker/$parentId/vital")({
  component: VitalForm,
});

const empty = {
  suhu: "",
  bpSistolik: "",
  bpDiastolik: "",
  nadi: "",
  pernafasan: "",
  gulaDarah: "",
  oksigen: "",
};

function num(s: string): number | undefined {
  const n = Number(s);
  return s !== "" && !Number.isNaN(n) ? n : undefined;
}

function VitalForm() {
  const { parentId } = useParams({ from: "/staf/tracker/$parentId/vital" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const parent = parents.find((p) => p.id === parentId);
  const [f, setF] = useState(empty);

  if (!parent) return <p>Warga emas tidak dijumpai.</p>;

  const set = (k: keyof typeof empty, val: string) =>
    setF((p) => ({ ...p, [k]: val }));
  const back = () =>
    navigate({ to: "/staf/tracker/$parentId", params: { parentId } });

  const submit = () => {
    if (!Object.values(f).some((x) => x !== "")) {
      toast.error("Isi sekurang-kurangnya satu bacaan");
      return;
    }
    const entry: VitalEntry = {
      masa: new Date().toISOString(),
      suhu: num(f.suhu),
      bpSistolik: num(f.bpSistolik),
      bpDiastolik: num(f.bpDiastolik),
      nadi: num(f.nadi),
      pernafasan: num(f.pernafasan),
      gulaDarah: num(f.gulaDarah),
      oksigen: num(f.oksigen),
      status: computeVitalStatus({
        suhu: num(f.suhu),
        bpSistolik: num(f.bpSistolik),
        nadi: num(f.nadi),
        pernafasan: num(f.pernafasan),
        gulaDarah: num(f.gulaDarah),
        oksigen: num(f.oksigen),
      }),
      pengesahan: user?.name ?? "",
    };
    addVitalEntry(parentId, user?.id ?? "", entry);
    toast.success("Tanda vital direkod");
    back();
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
        <h1 className="font-display text-2xl font-bold">Rekod Tanda Vital</h1>
        <p className="text-sm text-muted-foreground">
          Untuk:{" "}
          <span className="font-medium text-foreground">{parent.fullName}</span>{" "}
          · Masa direkod automatik bila disimpan.
        </p>
      </div>

      <NowStamp />

      <Card className="border-border/60 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Suhu (°C)">
            <Input
              inputMode="decimal"
              placeholder="36.5"
              value={f.suhu}
              onChange={(e) => set("suhu", e.target.value)}
            />
          </Field>
          <Field label="Nadi (bpm)">
            <Input
              inputMode="numeric"
              placeholder="72"
              value={f.nadi}
              onChange={(e) => set("nadi", e.target.value)}
            />
          </Field>
          <Field label="Pernafasan (b/min)">
            <Input
              inputMode="numeric"
              placeholder="16"
              value={f.pernafasan}
              onChange={(e) => set("pernafasan", e.target.value)}
            />
          </Field>
          <Field label="TD Sistolik">
            <Input
              inputMode="numeric"
              placeholder="120"
              value={f.bpSistolik}
              onChange={(e) => set("bpSistolik", e.target.value)}
            />
          </Field>
          <Field label="TD Diastolik">
            <Input
              inputMode="numeric"
              placeholder="80"
              value={f.bpDiastolik}
              onChange={(e) => set("bpDiastolik", e.target.value)}
            />
          </Field>
          <Field label="Gula Darah (mmol/L)">
            <Input
              inputMode="decimal"
              placeholder="6.2"
              value={f.gulaDarah}
              onChange={(e) => set("gulaDarah", e.target.value)}
            />
          </Field>
          <Field label="Oksigen SpO₂ (%)">
            <Input
              inputMode="numeric"
              placeholder="98"
              value={f.oksigen}
              onChange={(e) => set("oksigen", e.target.value)}
            />
          </Field>
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
