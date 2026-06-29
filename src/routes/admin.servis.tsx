import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SERVICE_TYPES,
  TRANSPORT_MODES,
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/mock-data";
import type { Booking, BookingStatus } from "@/lib/mock-data";
import {
  useBookings,
  useParents,
  useUsers,
  useCaregivers,
  useGetCaregiver,
  useInvalidate,
  qk,
} from "@/lib/data";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  MapPin,
  PlayCircle,
  UserCog,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/servis")({
  component: ServiceMonitoring,
});

const statusTone: Record<BookingStatus, string> = {
  pending: "bg-status-attention/15 text-status-attention",
  confirmed: "bg-teal/20 text-teal-foreground",
  ongoing: "bg-primary/15 text-primary",
  completed: "bg-status-normal/15 text-status-normal",
  cancelled: "bg-muted text-muted-foreground",
};

type FilterKey = "all" | BookingStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "confirmed", label: "Disahkan" },
  { key: "ongoing", label: "Sedang Berlangsung" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone[status]}`}
    >
      {BOOKING_STATUS_LABEL[status]}
    </span>
  );
}

function ServiceMonitoring() {
  const bookings = useBookings();
  const parents = useParents();
  const users = useUsers();
  const getCaregiver = useGetCaregiver();
  const invalidate = useInvalidate();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Booking | null>(null);

  const sorted = [...bookings].sort(
    (a, b) =>
      +new Date(`${b.date}T${b.time}`) - +new Date(`${a.date}T${a.time}`),
  );

  const counts: Record<FilterKey, number> = {
    all: bookings.length,
    pending: 0,
    confirmed: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  };
  bookings.forEach((b) => (counts[b.status] += 1));

  const rows = sorted.filter((b) => filter === "all" || b.status === filter);

  const setStatus = async (b: Booking, status: BookingStatus) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", b.id);
    if (error) return toast.error(error.message);
    setSelected((prev) => (prev && prev.id === b.id ? { ...prev, status } : prev));
    invalidate(qk.bookings);
    toast.success(`Status dikemas kini: ${BOOKING_STATUS_LABEL[status]}`);
  };

  const assignCaregiver = async (b: Booking, caregiverId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ caregiver_id: caregiverId || null })
      .eq("id", b.id);
    if (error) return toast.error(error.message);
    setSelected((prev) =>
      prev && prev.id === b.id ? { ...prev, caregiverId: caregiverId || undefined } : prev,
    );
    invalidate(qk.bookings);
    toast.success(caregiverId ? "Caregiver ditetapkan" : "Caregiver dikeluarkan");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Servis Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Pantau tempahan servis & urus status penjagaan seperti penjejakan
          pesanan.
        </p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f.label}
            <span className="ml-1 opacity-70">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {/* Bookings table */}
      <Card className="overflow-hidden border-border/60 p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tarikh & Masa</TableHead>
              <TableHead>Pelanggan (Anak)</TableHead>
              <TableHead>Warga Emas</TableHead>
              <TableHead>Servis</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Caregiver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Tiada tempahan servis.
                </TableCell>
              </TableRow>
            )}
            {rows.map((b) => {
              const anak = users.find((u) => u.id === b.anakId);
              const p = b.parentId
                ? parents.find((x) => x.id === b.parentId)
                : undefined;
              const svc = SERVICE_TYPES.find((s) => s.key === b.serviceType);
              const cg = getCaregiver(b.caregiverId);
              return (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {format(
                      new Date(`${b.date}T${b.time}`),
                      "dd MMM yyyy, HH:mm",
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {anak?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p?.fullName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{svc?.label}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                    {b.location}
                  </TableCell>
                  <TableCell className="text-sm">
                    {cg ? (
                      cg.name
                    ) : (
                      <span className="text-xs text-status-attention">
                        Belum ditetapkan
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelected(b)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" /> Lihat
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Detail pop-up */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {selected && (
            <ServiceDetail
              booking={selected}
              onSetStatus={setStatus}
              onAssignCaregiver={assignCaregiver}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceDetail({
  booking: b,
  onSetStatus,
  onAssignCaregiver,
}: {
  booking: Booking;
  onSetStatus: (b: Booking, status: BookingStatus) => void;
  onAssignCaregiver: (b: Booking, caregiverId: string) => void;
}) {
  const users = useUsers();
  const parents = useParents();
  const caregivers = useCaregivers();
  const getCaregiver = useGetCaregiver();
  const anak = users.find((u) => u.id === b.anakId);
  const p = b.parentId ? parents.find((x) => x.id === b.parentId) : undefined;
  const svc = SERVICE_TYPES.find((s) => s.key === b.serviceType);
  const trans = TRANSPORT_MODES.find((t) => t.key === b.transport);
  const cg = getCaregiver(b.caregiverId);

  return (
    <div className="space-y-5 pb-6">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <DialogTitle className="font-display text-lg">
            {svc?.label}
          </DialogTitle>
          <StatusPill status={b.status} />
        </div>
        <p className="text-xs text-muted-foreground">{svc?.desc}</p>
      </DialogHeader>

      {/* Status management — Grab-style flow */}
      <Section
        icon={<PlayCircle className="h-3.5 w-3.5" />}
        title="Urus Status"
      >
        <div className="flex flex-wrap gap-2">
          {b.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSetStatus(b, "confirmed")}
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Sahkan
            </Button>
          )}
          {(b.status === "pending" || b.status === "confirmed") && (
            <Button size="sm" onClick={() => onSetStatus(b, "ongoing")}>
              <PlayCircle className="mr-1 h-3.5 w-3.5" /> Mulakan Servis
            </Button>
          )}
          {b.status === "ongoing" && (
            <Button size="sm" onClick={() => onSetStatus(b, "completed")}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Tandakan Selesai
            </Button>
          )}
          {(b.status === "pending" || b.status === "confirmed") && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onSetStatus(b, "cancelled")}
            >
              <XCircle className="mr-1 h-3.5 w-3.5" /> Batalkan
            </Button>
          )}
        </div>
        {b.status === "ongoing" && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Servis sedang berlangsung — pelanggan tidak lagi boleh membatalkan
            tempahan ini.
          </p>
        )}
      </Section>

      {/* Customer & booking details */}
      <Section
        icon={<ClipboardList className="h-3.5 w-3.5" />}
        title="Butiran Tempahan"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Pelanggan (Anak)" value={anak?.name ?? "—"} />
          <Field label="No. Telefon" value={anak?.phone ?? "—"} />
          <Field
            label="Warga Emas"
            value={p?.fullName ?? "Tiada / belum berdaftar"}
            full
          />
          <Field
            label="Tarikh & Masa"
            value={format(
              new Date(`${b.date}T${b.time}`),
              "EEEE, dd MMM yyyy · HH:mm",
            )}
            full
          />
          <Field label="Pengangkutan" value={trans?.label ?? "—"} />
          <Field
            label="Bayaran"
            value={
              b.price != null
                ? `RM ${b.price.toFixed(2)}${b.paymentStatus ? ` · ${PAYMENT_STATUS_LABEL[b.paymentStatus]}` : ""}`
                : "—"
            }
          />
          <Field
            label="Lokasi"
            value={b.location}
            icon={<MapPin className="h-3.5 w-3.5" />}
            full
          />
        </div>
      </Section>

      {/* Notes */}
      {b.notes && (
        <Section
          icon={<ClipboardList className="h-3.5 w-3.5" />}
          title="Catatan / Permintaan Pelanggan"
        >
          <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            {b.notes}
          </p>
        </Section>
      )}

      {/* Caregiver assignment */}
      <Section
        icon={<UserCog className="h-3.5 w-3.5" />}
        title="Caregiver Ditugaskan"
      >
        {cg && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-muted/40 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={cg.avatar} alt={cg.name} />
              <AvatarFallback className="text-[10px]">
                {initials(cg.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{cg.name}</p>
              <p className="text-xs text-muted-foreground">
                {cg.specialization} · {cg.phone}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">Tetapkan / Tukar Caregiver</Label>
          <Select
            value={b.caregiverId ?? "none"}
            onValueChange={(v) => onAssignCaregiver(b, v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih caregiver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tiada caregiver</SelectItem>
              {caregivers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rekod harian dibuka di halaman berasingan, hanya selepas caregiver
            ditugaskan, supaya modal ini kekal ringkas. */}
        {cg && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link
                to="/admin/rekod-penjagaan/$bookingId"
                params={{ bookingId: b.id }}
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Lihat Rekod Harian
              </Link>
            </Button>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Lihat graf ringkasan & rekod penjagaan harian (vital, ubatan,
              makanan, aktiviti) yang direkodkan oleh caregiver.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  icon,
  full,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 flex items-start gap-1.5 text-sm font-medium">
        {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
        {value}
      </p>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
