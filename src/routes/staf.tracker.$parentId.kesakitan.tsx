import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PilihanSkala } from "@/components/pilihan-skala";
import { TahapPill } from "@/components/pemantauan-rujukan";
import { FieldLabel, TrackerFormShell } from "@/components/tracker-form-shell";
import { useParents } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { useSimpanPemantauan } from "@/hooks/use-simpan-pemantauan";
import {
  SKALA_KESAKITAN,
  labelKesakitan,
  tahapKesakitan,
} from "@/lib/pemantauan";
import type { KesakitanEntry } from "@/lib/pemantauan";

export const Route = createFileRoute("/staf/tracker/$parentId/kesakitan")({
  component: KesakitanForm,
});

// 0–10; the Wong-Baker face sits on the even scores.
const PILIHAN_SKOR = Array.from({ length: 11 }, (_, skor) => ({
  value: skor,
  label: String(skor),
  simbol: SKALA_KESAKITAN.find((k) => k.skor === skor)?.muka,
}));

function KesakitanForm() {
  const { parentId } = useParams({ from: "/staf/tracker/$parentId/kesakitan" });
  const { user } = useAuth();
  const parents = useParents();
  const parent = parents.find((p) => p.id === parentId);
  const { saving, simpan } = useSimpanPemantauan(parentId, user?.id ?? "");

  const [skor, setSkor] = useState<number>();
  const [lokasi, setLokasi] = useState("");
  const [catatan, setCatatan] = useState("");

  if (!parent)
    return (
      <p>
        {parents.length === 0
          ? "Memuatkan…"
          : "Penerima servis tidak dijumpai."}
      </p>
    );

  const submit = () => {
    if (skor === undefined) {
      toast.error("Sila pilih skor kesakitan");
      return;
    }
    const entry: KesakitanEntry = {
      masa: new Date().toISOString(),
      skor,
      lokasi: lokasi.trim() || undefined,
      catatan: catatan.trim() || undefined,
      pengesahan: user?.name ?? "",
    };
    void simpan("kesakitan_entries", entry, "Skor kesakitan direkod");
  };

  return (
    <TrackerFormShell
      parentId={parentId}
      parentName={parent.fullName}
      tajuk="Skor Kesakitan (Pain Score)"
      unit="kesakitan"
      saving={saving}
      onSubmit={submit}
    >
      <Card className="space-y-5 border-border/60 p-5">
        <p className="text-xs text-muted-foreground">
          Minta pesakit menunjukkan tahap kesakitan berdasarkan muka di bawah
          (Wong-Baker FACES).
        </p>
        <PilihanSkala
          label="Skor kesakitan (0–10) *"
          value={skor}
          onChange={setSkor}
          className="grid-cols-4 sm:grid-cols-6 md:grid-cols-11"
          options={PILIHAN_SKOR}
        />
        {skor !== undefined && (
          <p className="flex items-center gap-2 text-xs">
            Skor {skor}:{" "}
            <TahapPill
              tahap={tahapKesakitan(skor)}
              label={labelKesakitan(skor)}
            />
          </p>
        )}

        <div className="space-y-1">
          <FieldLabel htmlFor="kesakitan-lokasi">Lokasi kesakitan</FieldLabel>
          <Input
            id="kesakitan-lokasi"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            placeholder="Cth: Lutut kiri"
          />
        </div>
        <div className="space-y-1">
          <FieldLabel htmlFor="kesakitan-catatan">Catatan</FieldLabel>
          <Input
            id="kesakitan-catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Faktor yang memburukkan atau mengurangkan kesakitan"
          />
        </div>
      </Card>
    </TrackerFormShell>
  );
}
