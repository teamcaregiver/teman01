import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PilihanSkala } from "@/components/pilihan-skala";
import { TahapPill } from "@/components/pemantauan-rujukan";
import { FieldLabel, TrackerFormShell } from "@/components/tracker-form-shell";
import { useParents } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { useSimpanPemantauan } from "@/hooks/use-simpan-pemantauan";
import {
  FAKTOR_RISIKO_JATUH,
  KEJADIAN_JATUH,
  NOTA_RISIKO_JATUH,
  tahapRisikoJatuh,
} from "@/lib/pemantauan";
import type {
  FaktorRisikoJatuh,
  KejadianJatuh,
  RisikoJatuhEntry,
} from "@/lib/pemantauan";

export const Route = createFileRoute("/staf/tracker/$parentId/risiko-jatuh")({
  component: RisikoJatuhForm,
});

function RisikoJatuhForm() {
  const { parentId } = useParams({
    from: "/staf/tracker/$parentId/risiko-jatuh",
  });
  const { user } = useAuth();
  const parents = useParents();
  const parent = parents.find((p) => p.id === parentId);
  const { saving, simpan } = useSimpanPemantauan(parentId, user?.id ?? "");

  const [faktor, setFaktor] = useState<FaktorRisikoJatuh[]>([]);
  const [kejadian, setKejadian] = useState<KejadianJatuh>("tiada");
  const [catatan, setCatatan] = useState("");

  if (!parent)
    return (
      <p>
        {parents.length === 0
          ? "Memuatkan…"
          : "Penerima servis tidak dijumpai."}
      </p>
    );

  const toggle = (key: FaktorRisikoJatuh, ya: boolean) =>
    setFaktor((prev) =>
      ya
        ? [...prev.filter((k) => k !== key), key]
        : prev.filter((k) => k !== key),
    );

  // Every factor not ticked is a "Tidak", so an all-clear assessment is valid too.
  const submit = () => {
    const entry: RisikoJatuhEntry = {
      masa: new Date().toISOString(),
      // Kept in the manual's order, whatever order they were ticked in.
      faktor: FAKTOR_RISIKO_JATUH.map((f) => f.key).filter((k) =>
        faktor.includes(k),
      ),
      kejadian,
      catatan: catatan.trim() || undefined,
      pengesahan: user?.name ?? "",
    };
    void simpan(
      "risiko_jatuh_entries",
      entry,
      "Penilaian risiko jatuh direkod",
    );
  };

  const tahap = tahapRisikoJatuh({ faktor, kejadian });

  return (
    <TrackerFormShell
      parentId={parentId}
      parentName={parent.fullName}
      tajuk="Penilaian Risiko Jatuh"
      unit="risikoJatuh"
      saving={saving}
      onSubmit={submit}
    >
      <Card className="space-y-5 border-border/60 p-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium">
              Faktor risiko — tandakan jika "Ya"
            </p>
            <TahapPill
              tahap={tahap}
              label={`${faktor.length} / ${FAKTOR_RISIKO_JATUH.length} faktor`}
            />
          </div>
          <div className="grid gap-2">
            {FAKTOR_RISIKO_JATUH.map((f) => {
              const ya = faktor.includes(f.key);
              return (
                <label
                  key={f.key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
                >
                  <span className="text-sm">{f.label}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {ya ? "Ya" : "Tidak"}
                    <Checkbox
                      checked={ya}
                      onCheckedChange={(v) => toggle(f.key, v === true)}
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <PilihanSkala
          label="Kejadian jatuh sejak penilaian lepas"
          value={kejadian}
          onChange={setKejadian}
          className="grid-cols-2"
          options={KEJADIAN_JATUH.map((k) => ({
            value: k.key,
            label: k.label,
          }))}
        />

        <div className="space-y-1">
          <FieldLabel htmlFor="risiko-jatuh-catatan">Catatan</FieldLabel>
          <Input
            id="risiko-jatuh-catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Cth: Laluan bilik air licin, sudah dimaklumkan kepada keluarga"
          />
        </div>

        <p className="text-[11px] italic text-muted-foreground">
          {NOTA_RISIKO_JATUH}
        </p>
      </Card>
    </TrackerFormShell>
  );
}
