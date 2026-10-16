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
  BRISTOL,
  JENIS_PERKUMUHAN,
  WARNA_URIN,
  tafsiranBristol,
  tafsiranUrin,
} from "@/lib/pemantauan";
import type { JenisPerkumuhan, PerkumuhanEntry } from "@/lib/pemantauan";

export const Route = createFileRoute("/staf/tracker/$parentId/perkumuhan")({
  component: PerkumuhanForm,
});

const KEADAAN_PLACEHOLDER: Record<JenisPerkumuhan, string> = {
  kencing: "Cth: Keruh, berbau kuat",
  najis: "Cth: Ada darah, berlendir",
  muntah: "Cth: Kekuningan, sisa makanan",
};

function PerkumuhanForm() {
  const { parentId } = useParams({
    from: "/staf/tracker/$parentId/perkumuhan",
  });
  const { user } = useAuth();
  const parents = useParents();
  const parent = parents.find((p) => p.id === parentId);
  const { saving, simpan } = useSimpanPemantauan(parentId, user?.id ?? "");

  const [jenis, setJenis] = useState<JenisPerkumuhan>();
  const [bristol, setBristol] = useState<number>();
  const [warnaUrin, setWarnaUrin] = useState<number>();
  const [kekerapan, setKekerapan] = useState("1");
  const [keadaan, setKeadaan] = useState("");
  const [catatan, setCatatan] = useState("");

  if (!parent)
    return (
      <p>
        {parents.length === 0
          ? "Memuatkan…"
          : "Penerima servis tidak dijumpai."}
      </p>
    );

  const tafsiran =
    jenis === "najis" && bristol
      ? tafsiranBristol(bristol)
      : jenis === "kencing" && warnaUrin
        ? tafsiranUrin(warnaUrin)
        : undefined;

  const submit = () => {
    if (!jenis) {
      toast.error("Sila pilih jenis perkumuhan");
      return;
    }
    const kali = kekerapan.trim() === "" ? 1 : Number(kekerapan);
    if (!Number.isInteger(kali) || kali < 1 || kali > 20) {
      toast.error("Kekerapan mesti nombor bulat antara 1 dan 20");
      return;
    }
    const entry: PerkumuhanEntry = {
      masa: new Date().toISOString(),
      jenis,
      kekerapan: kali,
      bristol: jenis === "najis" ? bristol : undefined,
      warnaUrin: jenis === "kencing" ? warnaUrin : undefined,
      keadaan: keadaan.trim() || undefined,
      catatan: catatan.trim() || undefined,
      pengesahan: user?.name ?? "",
    };
    void simpan("perkumuhan_entries", entry, "Perkumuhan direkod");
  };

  return (
    <TrackerFormShell
      parentId={parentId}
      parentName={parent.fullName}
      tajuk="Rekod Perkumuhan"
      unit="perkumuhan"
      saving={saving}
      onSubmit={submit}
    >
      <Card className="space-y-5 border-border/60 p-5">
        <PilihanSkala
          label="Jenis *"
          value={jenis}
          onChange={setJenis}
          className="grid-cols-3"
          options={JENIS_PERKUMUHAN.map((j) => ({
            value: j.key,
            label: j.label,
          }))}
        />

        {jenis === "kencing" && (
          <PilihanSkala
            label="Warna air kencing (carta warna urin)"
            value={warnaUrin}
            onChange={setWarnaUrin}
            onClear={() => setWarnaUrin(undefined)}
            className="grid-cols-4 sm:grid-cols-8"
            options={WARNA_URIN.map((w) => ({
              value: w.tahap,
              label: String(w.tahap),
              swatch: w.warna,
            }))}
          />
        )}

        {jenis === "najis" && (
          <PilihanSkala
            label="Jenis najis (Bristol Stool Chart)"
            value={bristol}
            onChange={setBristol}
            onClear={() => setBristol(undefined)}
            className="sm:grid-cols-2"
            options={BRISTOL.map((b) => ({
              value: b.jenis,
              label: `Jenis ${b.jenis}`,
              hint: b.label,
            }))}
          />
        )}

        {tafsiran && (
          <p className="flex items-center gap-2 text-xs">
            Tafsiran:{" "}
            <TahapPill tahap={tafsiran.tahap} label={tafsiran.label} />
          </p>
        )}

        {jenis && (
          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <div className="space-y-1">
              <FieldLabel htmlFor="perkumuhan-kekerapan">
                Kekerapan (kali)
              </FieldLabel>
              <Input
                id="perkumuhan-kekerapan"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={kekerapan}
                onChange={(e) => setKekerapan(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <FieldLabel htmlFor="perkumuhan-keadaan">
                Keadaan (warna, tekstur, bau)
              </FieldLabel>
              <Input
                id="perkumuhan-keadaan"
                value={keadaan}
                onChange={(e) => setKeadaan(e.target.value)}
                placeholder={KEADAAN_PLACEHOLDER[jenis]}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <FieldLabel htmlFor="perkumuhan-catatan">Catatan</FieldLabel>
          <Input
            id="perkumuhan-catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Pilihan"
          />
        </div>
      </Card>
    </TrackerFormShell>
  );
}
