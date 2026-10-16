import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PilihanSkala } from "@/components/pilihan-skala";
import { FieldLabel, TrackerFormShell } from "@/components/tracker-form-shell";
import { useParents, useTrackers } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { pickTodayRecord } from "@/lib/tracker-actions";
import { useSimpanPemantauan } from "@/hooks/use-simpan-pemantauan";
import {
  POSISI,
  cadanganPosisi,
  labelPosisi,
  posisiSeterusnya,
} from "@/lib/pemantauan";
import type { Posisi, PosisiEntry } from "@/lib/pemantauan";

export const Route = createFileRoute("/staf/tracker/$parentId/posisi")({
  component: PosisiForm,
});

const TUJUAN_CADANGAN = [
  "Cegah luka tekanan",
  "Keselesaan pesakit",
  "Makan / minum",
  "Rawatan / pemeriksaan",
];

function PosisiForm() {
  const { parentId } = useParams({ from: "/staf/tracker/$parentId/posisi" });
  const { user } = useAuth();
  const parents = useParents();
  const trackers = useTrackers();
  const parent = parents.find((p) => p.id === parentId);
  const { saving, simpan } = useSimpanPemantauan(parentId, user?.id ?? "");

  // The Clock Turn Schedule position for this hour is the starting choice.
  const [cadangan] = useState(() => cadanganPosisi(new Date().getHours()));
  const [posisi, setPosisi] = useState<Posisi>(cadangan);
  const [posisiLain, setPosisiLain] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [lukaTekanan, setLukaTekanan] = useState(false);
  const [catatan, setCatatan] = useState("");

  if (!parent)
    return (
      <p>
        {parents.length === 0
          ? "Memuatkan…"
          : "Penerima servis tidak dijumpai."}
      </p>
    );

  const today = pickTodayRecord(trackers, parentId, user?.id);
  const terakhir = today?.posisiEntries?.[today.posisiEntries.length - 1];

  const submit = () => {
    if (posisi === "lain" && !posisiLain.trim()) {
      toast.error("Sila nyatakan posisi");
      return;
    }
    const entry: PosisiEntry = {
      masa: new Date().toISOString(),
      posisi,
      posisiLain: posisi === "lain" ? posisiLain.trim() : undefined,
      tujuan: tujuan.trim() || undefined,
      tandaLukaTekanan: lukaTekanan || undefined,
      catatan: catatan.trim() || undefined,
      pengesahan: user?.name ?? "",
    };
    void simpan("posisi_entries", entry, "Penukaran posisi direkod");
  };

  const labelCadangan = POSISI.find((p) => p.key === cadangan)!;

  return (
    <TrackerFormShell
      parentId={parentId}
      parentName={parent.fullName}
      tajuk="Penukaran Posisi (Pesakit Terlantar)"
      unit="posisi"
      saving={saving}
      onSubmit={submit}
    >
      <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-card p-3 text-xs">
        <RotateCw className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
        <div className="space-y-0.5">
          <p>
            Cadangan carta (Clock Turn Schedule) untuk jam ini:{" "}
            <span className="font-semibold">
              {labelCadangan.label} ({labelCadangan.en})
            </span>
          </p>
          {terakhir ? (
            <p className="text-muted-foreground">
              Penukaran terakhir: {format(new Date(terakhir.masa), "HH:mm")} (
              {labelPosisi(terakhir)}) · Seterusnya sebelum{" "}
              {format(posisiSeterusnya(terakhir.masa), "HH:mm")}
            </p>
          ) : (
            <p className="text-muted-foreground">
              Belum ada penukaran posisi direkod hari ini.
            </p>
          )}
        </div>
      </div>

      <Card className="space-y-5 border-border/60 p-5">
        <PilihanSkala
          label="Posisi diberikan *"
          value={posisi}
          onChange={setPosisi}
          className="grid-cols-2"
          options={POSISI.map((p) => ({
            value: p.key,
            label: p.label,
            hint: p.en,
          }))}
        />
        {posisi === "lain" && (
          <div className="space-y-1">
            <FieldLabel htmlFor="posisi-lain">Nyatakan posisi *</FieldLabel>
            <Input
              id="posisi-lain"
              value={posisiLain}
              onChange={(e) => setPosisiLain(e.target.value)}
              placeholder="Cth: Separa duduk (Fowler)"
            />
          </div>
        )}

        <div className="space-y-1">
          <FieldLabel htmlFor="posisi-tujuan">Tujuan</FieldLabel>
          <Input
            id="posisi-tujuan"
            value={tujuan}
            onChange={(e) => setTujuan(e.target.value)}
            placeholder="Cth: Cegah luka tekanan"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {TUJUAN_CADANGAN.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTujuan(t)}
                className="cursor-pointer rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
          <Checkbox
            checked={lukaTekanan}
            onCheckedChange={(v) => setLukaTekanan(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm">
            Ada kemerahan atau tanda luka tekanan pada kulit
            <span className="block text-[11px] text-muted-foreground">
              Periksa tumit, pinggul, siku dan belakang badan semasa menukar
              posisi.
            </span>
          </span>
        </label>

        <div className="space-y-1">
          <FieldLabel htmlFor="posisi-catatan">Catatan</FieldLabel>
          <Input
            id="posisi-catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Ketidakselesaan, aduan kesakitan, dll."
          />
        </div>
      </Card>
    </TrackerFormShell>
  );
}
