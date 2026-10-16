import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PilihanSkala } from "@/components/pilihan-skala";
import { FieldLabel, TrackerFormShell } from "@/components/tracker-form-shell";
import { useParents } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { useSimpanPemantauan } from "@/hooks/use-simpan-pemantauan";
import { SKALA_TINGKAH_LAKU } from "@/lib/pemantauan";
import type { AspekTingkahLaku, TingkahLakuEntry } from "@/lib/pemantauan";

export const Route = createFileRoute("/staf/tracker/$parentId/tingkah-laku")({
  component: TingkahLakuForm,
});

type Skor = Partial<Record<AspekTingkahLaku, number>>;

function TingkahLakuForm() {
  const { parentId } = useParams({
    from: "/staf/tracker/$parentId/tingkah-laku",
  });
  const { user } = useAuth();
  const parents = useParents();
  const parent = parents.find((p) => p.id === parentId);
  const { saving, simpan } = useSimpanPemantauan(parentId, user?.id ?? "");

  const [skor, setSkor] = useState<Skor>({});
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
    if (Object.values(skor).every((v) => v === undefined)) {
      toast.error("Pilih skor bagi sekurang-kurangnya satu pemerhatian");
      return;
    }
    const entry: TingkahLakuEntry = {
      masa: new Date().toISOString(),
      ...skor,
      catatan: catatan.trim() || undefined,
      pengesahan: user?.name ?? "",
    };
    void simpan(
      "tingkah_laku_entries",
      entry,
      "Pemerhatian tingkah laku direkod",
    );
  };

  return (
    <TrackerFormShell
      parentId={parentId}
      parentName={parent.fullName}
      tajuk="Pemerhatian Tingkah Laku & Emosi"
      unit="tingkahLaku"
      saving={saving}
      onSubmit={submit}
    >
      <Card className="space-y-5 border-border/60 p-5">
        <p className="text-xs text-muted-foreground">
          Pilih satu skor (1–5) yang paling menggambarkan keadaan pesakit bagi
          setiap pemerhatian.
        </p>
        {SKALA_TINGKAH_LAKU.map((s) => (
          <PilihanSkala
            key={s.key}
            label={s.label}
            value={skor[s.key]}
            onChange={(v) => setSkor((prev) => ({ ...prev, [s.key]: v }))}
            onClear={() => setSkor((prev) => ({ ...prev, [s.key]: undefined }))}
            className="grid-cols-2 sm:grid-cols-5"
            options={s.pilihan.map((label, i) => ({
              value: i + 1,
              label: `${i + 1}`,
              hint: label,
            }))}
          />
        ))}

        <div className="space-y-1">
          <FieldLabel htmlFor="tingkah-laku-catatan">Catatan</FieldLabel>
          <Input
            id="tingkah-laku-catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Perubahan, kejadian luar biasa atau faktor yang mempengaruhi"
          />
        </div>
      </Card>
    </TrackerFormShell>
  );
}
