import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { HeartHandshake, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRANSPORT_MODES } from "@/lib/mock-data";
import type { TransportMode } from "@/lib/mock-data";
import {
  qk,
  useCaregivers,
  useInvalidate,
  useParents,
  useServiceTypes,
  useUsers,
} from "@/lib/data";
import { supabase } from "@/lib/supabase/client";
import {
  alamatServis,
  barisTempahan,
  drafKosong,
  pilihanPenempah,
  semakTempahan,
} from "@/lib/tempahan";
import type { DrafTempahan, StatusAwal } from "@/lib/tempahan";

const TIADA = "none";

/** Admin books a service on behalf of a family (families cannot book themselves). */
export function TempahanBaruDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {/* Mounted only while open, so every booking starts from an empty form. */}
        {open && <BorangTempahan onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function BorangTempahan({ onDone }: { onDone: () => void }) {
  const parents = useParents();
  const users = useUsers();
  const caregivers = useCaregivers();
  const serviceTypes = useServiceTypes();
  const invalidate = useInvalidate();

  const [draf, setDraf] = useState<DrafTempahan>(drafKosong);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<DrafTempahan>) =>
    setDraf((d) => ({ ...d, ...patch }));

  const penerima = parents.find((p) => p.id === draf.parentId);
  const penempah = pilihanPenempah(penerima, users);
  const temanion = caregivers.filter((c) => c.status === "active");
  // Default to the first service once the list has loaded.
  const serviceTypeId = draf.serviceTypeId || serviceTypes[0]?.id || "";

  const pilihPenerima = (parentId: string) => {
    const p = parents.find((x) => x.id === parentId);
    const keluarga = pilihanPenempah(p, users);
    set({
      parentId,
      // One linked family account is the booker; with several, admin picks.
      anakId: keluarga.length === 1 ? keluarga[0].id : "",
      location: alamatServis(draf.location, penerima?.address, p?.address),
    });
  };

  const simpan = async () => {
    const d = { ...draf, serviceTypeId };
    const masalah = semakTempahan(d);
    if (masalah) {
      toast.error(masalah);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("bookings").insert(barisTempahan(d));
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate(qk.bookings);
    toast.success(
      d.status === "confirmed"
        ? "Tempahan dicipta dan disahkan."
        : "Tempahan dicipta. Menunggu pengesahan.",
    );
    onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tambah Tempahan</DialogTitle>
        <DialogDescription>
          Tempahan servis dibuat oleh admin bagi pihak keluarga penerima servis.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-1">
        <Field label="Penerima Servis *" htmlFor="tempahan-penerima">
          <Select
            value={draf.parentId || undefined}
            onValueChange={pilihPenerima}
          >
            <SelectTrigger id="tempahan-penerima">
              <SelectValue placeholder="Pilih penerima servis" />
            </SelectTrigger>
            <SelectContent>
              {parents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Penempah Servis *" htmlFor="tempahan-penempah">
          <Select
            value={draf.anakId || undefined}
            onValueChange={(anakId) => set({ anakId })}
            disabled={!penerima || penempah.length === 0}
          >
            <SelectTrigger id="tempahan-penempah">
              <SelectValue
                placeholder={
                  penerima
                    ? "Pilih penempah servis"
                    : "Pilih penerima servis dahulu"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {penempah.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {penerima && penempah.length === 0 ? (
            <p className="text-[11px] text-status-attention">
              {penerima.fullName} belum dipautkan kepada akaun keluarga.{" "}
              <Link
                to="/admin/warga-emas/$parentId/edit"
                params={{ parentId: penerima.id }}
                className="font-medium underline underline-offset-2"
              >
                Pautkan akaun keluarga
              </Link>{" "}
              dahulu.
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Akaun keluarga yang dipautkan kepada penerima servis ini.
            </p>
          )}
        </Field>

        <div className="space-y-1.5">
          <Label className="text-xs">Jenis Servis *</Label>
          <div
            className="grid gap-2 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Jenis servis"
          >
            {serviceTypes.map((s) => {
              const active = serviceTypeId === s.id;
              const Icon =
                s.code === "companion" ? HeartHandshake : Stethoscope;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  key={s.id}
                  onClick={() => set({ serviceTypeId: s.id })}
                  className={`cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <p className="mt-1.5 text-sm font-semibold">{s.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {s.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tarikh *" htmlFor="tempahan-tarikh">
            <Input
              id="tempahan-tarikh"
              type="date"
              value={draf.date}
              onChange={(e) => set({ date: e.target.value })}
            />
          </Field>
          <Field label="Masa *" htmlFor="tempahan-masa">
            <Input
              id="tempahan-masa"
              type="time"
              value={draf.time}
              onChange={(e) => set({ time: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Lokasi / Alamat Servis *" htmlFor="tempahan-lokasi">
          <Textarea
            id="tempahan-lokasi"
            rows={2}
            value={draf.location}
            onChange={(e) => set({ location: e.target.value })}
            placeholder="Alamat penuh untuk servis dijalankan"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Pengangkutan" htmlFor="tempahan-pengangkutan">
            <Select
              value={draf.transport}
              onValueChange={(v) => set({ transport: v as TransportMode })}
            >
              <SelectTrigger id="tempahan-pengangkutan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORT_MODES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status" htmlFor="tempahan-status">
            <Select
              value={draf.status}
              onValueChange={(v) => set({ status: v as StatusAwal })}
            >
              <SelectTrigger id="tempahan-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Disahkan</SelectItem>
                <SelectItem value="pending">Menunggu Pengesahan</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Temanion (pilihan)" htmlFor="tempahan-temanion">
          <Select
            value={draf.caregiverId || TIADA}
            onValueChange={(v) => set({ caregiverId: v === TIADA ? "" : v })}
          >
            <SelectTrigger id="tempahan-temanion">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TIADA}>Tetapkan kemudian</SelectItem>
              {temanion.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Catatan (pilihan)" htmlFor="tempahan-catatan">
          <Textarea
            id="tempahan-catatan"
            rows={2}
            value={draf.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Keperluan khas, masa tambahan, dll."
          />
        </Field>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Batal
        </Button>
        <Button onClick={() => void simpan()} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Tempahan"}
        </Button>
      </DialogFooter>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
