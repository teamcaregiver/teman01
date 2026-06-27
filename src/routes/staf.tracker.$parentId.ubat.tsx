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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parents,
  medications,
  medsForParent,
  CARA_PENGAMBILAN,
  PRN_TYPE_LABEL,
} from "@/lib/mock-data";
import type {
  Medication,
  UbatItem,
  UbatanEntry,
  PrnType,
} from "@/lib/mock-data";
import { addUbatanEntry } from "@/lib/tracker-actions";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import { NowStamp } from "@/components/now-stamp";

export const Route = createFileRoute("/staf/tracker/$parentId/ubat")({
  component: UbatForm,
});

const emptyNewMed = {
  namaUbat: "",
  dos: "",
  caraPengambilan: "",
  kekerapan: "",
  catatan: "",
  prn: false,
  prnType: "prn" as PrnType,
};

function UbatForm() {
  const { parentId } = useParams({ from: "/staf/tracker/$parentId/ubat" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const parent = parents.find((p) => p.id === parentId);

  const [meds, setMeds] = useState<Medication[]>(() => medsForParent(parentId));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState(emptyNewMed);

  if (!parent) return <p>Warga emas tidak dijumpai.</p>;

  const back = () =>
    navigate({ to: "/staf/tracker/$parentId", params: { parentId } });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const normalMeds = meds.filter((m) => !m.prn);
  const prnMeds = meds.filter((m) => m.prn);

  const submitAddMed = () => {
    if (!newMed.namaUbat.trim()) {
      toast.error("Nama ubat diperlukan");
      return;
    }
    const med: Medication = {
      id: `med-${Date.now()}`,
      parentId,
      namaUbat: newMed.namaUbat,
      dos: newMed.dos,
      caraPengambilan: newMed.caraPengambilan,
      kekerapan: newMed.kekerapan || undefined,
      catatan: newMed.catatan || undefined,
      prn: newMed.prn,
      prnType: newMed.prn ? newMed.prnType : undefined,
    };
    medications.push(med);
    setMeds((prev) => [...prev, med]);
    setNewMed(emptyNewMed);
    setShowAdd(false);
    toast.success("Ubat baharu ditambah ke senarai");
  };

  const submitGive = () => {
    if (selected.size === 0) {
      toast.error("Pilih sekurang-kurangnya satu ubat yang diberi");
      return;
    }
    const items: UbatItem[] = meds
      .filter((m) => selected.has(m.id))
      .map((m) => ({
        namaUbat: m.namaUbat,
        dos: m.dos,
        caraPengambilan: m.caraPengambilan,
        catatan: m.catatan,
        prn: m.prn,
        prnType: m.prnType,
      }));
    const entry: UbatanEntry = {
      masa: new Date().toISOString(),
      items,
      catatan: note.trim() || undefined,
      pengesahan: user?.name ?? "",
    };
    addUbatanEntry(parentId, user?.id ?? "", entry);
    toast.success("Pengambilan ubat direkod");
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
        <h1 className="font-display text-2xl font-bold">
          Rekod Pengambilan Ubat
        </h1>
        <p className="text-sm text-muted-foreground">
          Untuk:{" "}
          <span className="font-medium text-foreground">{parent.fullName}</span>{" "}
          · Tanda ubat yang diberi sekarang. Masa direkod automatik.
        </p>
      </div>

      <NowStamp />

      <Card className="border-border/60 space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Senarai Ubat
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowAdd((s) => !s)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Ubat
          </Button>
        </div>

        {/* Add new medication form */}
        {showAdd && (
          <div className="space-y-3 rounded-xl border border-teal/30 bg-teal/5 p-3">
            <p className="text-sm font-semibold">Ubat Baharu</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama Ubat">
                <Input
                  value={newMed.namaUbat}
                  onChange={(e) =>
                    setNewMed((p) => ({ ...p, namaUbat: e.target.value }))
                  }
                  placeholder="Cth: Metformin"
                />
              </Field>
              <Field label="Dos">
                <Input
                  value={newMed.dos}
                  onChange={(e) =>
                    setNewMed((p) => ({ ...p, dos: e.target.value }))
                  }
                  placeholder="Cth: 500mg"
                />
              </Field>
              <Field label="Cara Makan / Pengambilan">
                <Select
                  value={newMed.caraPengambilan}
                  onValueChange={(v) =>
                    setNewMed((p) => ({ ...p, caraPengambilan: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARA_PENGAMBILAN.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Kekerapan / Jadual">
                <Input
                  value={newMed.kekerapan}
                  onChange={(e) =>
                    setNewMed((p) => ({ ...p, kekerapan: e.target.value }))
                  }
                  placeholder="Cth: 2x sehari"
                />
              </Field>
              <div className="col-span-2">
                <Field label="Nota">
                  <Input
                    value={newMed.catatan}
                    onChange={(e) =>
                      setNewMed((p) => ({ ...p, catatan: e.target.value }))
                    }
                    placeholder="Pilihan"
                  />
                </Field>
              </div>
              <div className="col-span-2 space-y-2.5 rounded-lg border border-border p-2.5">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm">
                    PRN / Kecemasan
                    <span className="block text-[11px] text-muted-foreground">
                      Hanya diberi bila perlu — pilih manual
                    </span>
                  </span>
                  <Switch
                    checked={newMed.prn}
                    onCheckedChange={(v) =>
                      setNewMed((p) => ({ ...p, prn: v }))
                    }
                  />
                </label>
                {newMed.prn && (
                  <Field label="Jenis">
                    <Select
                      value={newMed.prnType}
                      onValueChange={(v) =>
                        setNewMed((p) => ({ ...p, prnType: v as PrnType }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prn">PRN</SelectItem>
                        <SelectItem value="kecemasan">Kecemasan</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAdd(false);
                  setNewMed(emptyNewMed);
                }}
              >
                Batal
              </Button>
              <Button type="button" size="sm" onClick={submitAddMed}>
                Tambah ke Senarai
              </Button>
            </div>
          </div>
        )}

        {meds.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Tiada ubat dalam senarai. Tekan "Tambah Ubat".
          </p>
        )}

        {/* Normal medication */}
        {normalMeds.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              Ubat Biasa
            </p>
            {normalMeds.map((m) => (
              <MedRow
                key={m.id}
                med={m}
                checked={selected.has(m.id)}
                onToggle={() => toggle(m.id)}
              />
            ))}
          </div>
        )}

        {/* PRN / emergency medication — must be picked manually */}
        {prnMeds.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-status-attention">
              PRN / Kecemasan (pilih manual bila diberi)
            </p>
            {prnMeds.map((m) => (
              <MedRow
                key={m.id}
                med={m}
                checked={selected.has(m.id)}
                onToggle={() => toggle(m.id)}
              />
            ))}
          </div>
        )}

        <Field label="Nota (pilihan)">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cth: diberi selepas makan"
          />
        </Field>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={back}>
          Batal
        </Button>
        <Button
          type="button"
          onClick={submitGive}
          disabled={selected.size === 0}
        >
          Rekod Pengambilan ({selected.size})
        </Button>
      </div>
    </div>
  );
}

function MedRow({
  med,
  checked,
  onToggle,
}: {
  med: Medication;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/40">
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {med.namaUbat}{" "}
          {med.dos && (
            <span className="font-normal text-muted-foreground">
              — {med.dos}
            </span>
          )}
          {med.prn && (
            <span className="ml-1 rounded-full bg-status-attention/15 px-1.5 text-[10px] font-medium text-status-attention">
              {med.prnType ? PRN_TYPE_LABEL[med.prnType] : "PRN"}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {[med.caraPengambilan, med.kekerapan, med.catatan]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>
    </label>
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
