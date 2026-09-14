import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { BookingStatusPill } from "@/components/booking-status-pill";
import {
  TRANSPORT_MODES,
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/mock-data";
import type { Booking, BookingStatus, PaymentStatus } from "@/lib/mock-data";
import {
  useBookingsQuery,
  useParents,
  useUsers,
  useCaregivers,
  useGetCaregiver,
  useGetServiceType,
  useInvalidate,
  qk,
} from "@/lib/data";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
  CreditCard,
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

type FilterKey = "all" | BookingStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "confirmed", label: "Disahkan" },
  { key: "ongoing", label: "Sedang Berlangsung" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

function ServiceMonitoring() {
  const bookingsQ = useBookingsQuery();
  const bookings = bookingsQ.data ?? [];
  const parents = useParents();
  const users = useUsers();
  const getCaregiver = useGetCaregiver();
  const getServiceType = useGetServiceType();
  const invalidate = useInvalidate();
  const [filter, setFilter] = useState<FilterKey>("all");
  // Track the id, not a snapshot: after any mutation the dialog re-reads the
  // refreshed row from the list instead of being patched by hand.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = bookings.find((b) => b.id === selectedId) ?? null;

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
    invalidate(qk.bookings);
    toast.success(`Status dikemas kini: ${BOOKING_STATUS_LABEL[status]}`);
  };

  const assignCaregiver = async (b: Booking, caregiverId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ caregiver_id: caregiverId || null })
      .eq("id", b.id);
    if (error) return toast.error(error.message);
    invalidate(qk.bookings);
    toast.success(caregiverId ? "Caregiver ditetapkan" : "Caregiver dikeluarkan");
  };

  /** Admin-only pricing. The DB trigger in migration 0008 enforces the same rule. */
  const savePayment = async (
    b: Booking,
    patch: { price: number | null; paymentStatus: PaymentStatus | null; paymentNotes: string },
  ) => {
    const { error } = await supabase
      .from("bookings")
      .update({
        price: patch.price,
        payment_status: patch.paymentStatus,
        payment_notes: patch.paymentNotes.trim() || null,
      })
      .eq("id", b.id);
    if (error) throw new Error(error.message);
    invalidate(qk.bookings);
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
        <div className="overflow-x-auto">
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
            {bookingsQ.isPending &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`s${i}`} className="hover:bg-transparent">
                  <TableCell colSpan={8}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {bookingsQ.isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-10 text-center">
                  <p className="text-sm font-medium">Gagal memuatkan tempahan</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(bookingsQ.error as Error).message}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => void bookingsQ.refetch()}
                  >
                    Cuba lagi
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {!bookingsQ.isPending && !bookingsQ.isError && rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-10 text-center">
                  <p className="text-sm font-medium">
                    {filter === "all" ? "Tiada tempahan servis" : "Tiada tempahan dalam status ini"}
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    {filter === "all"
                      ? "Tempahan yang dihantar oleh anak akan dipaparkan di sini."
                      : "Cuba pilih tab status yang lain."}
                  </p>
                </TableCell>
              </TableRow>
            )}
            {rows.map((b) => {
              const anak = users.find((u) => u.id === b.anakId);
              const p = b.parentId
                ? parents.find((x) => x.id === b.parentId)
                : undefined;
              const svc = getServiceType(b.serviceTypeId);
              const cg = getCaregiver(b.caregiverId);
              const when = format(new Date(`${b.date}T${b.time}`), "dd MMM yyyy, HH:mm");
              return (
                <TableRow
                  key={b.id}
                  tabIndex={0}
                  aria-label={`Lihat tempahan ${svc?.name ?? "servis"} — ${anak?.name ?? "pelanggan"} pada ${when}`}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
                  onClick={(e) => {
                    // Let controls inside the row keep their own behaviour.
                    if ((e.target as HTMLElement).closest("a,button,input,select,[role='checkbox']")) {
                      return;
                    }
                    setSelectedId(b.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(b.id);
                    }
                  }}
                >
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {when}
                  </TableCell>
                  <TableCell className="font-medium">
                    {anak?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p?.fullName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{svc?.name}</TableCell>
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
                    <BookingStatusPill status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedId(b.id)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" /> Lihat
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Detail pop-up */}
      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {selected ? (
            <ServiceDetail
              booking={selected}
              onSetStatus={setStatus}
              onAssignCaregiver={assignCaregiver}
              onSavePayment={savePayment}
            />
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm font-medium">Tempahan tidak dijumpai</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tempahan ini mungkin telah dipadam atau dimuat semula.
              </p>
            </div>
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
  onSavePayment,
}: {
  booking: Booking;
  onSetStatus: (b: Booking, status: BookingStatus) => void;
  onAssignCaregiver: (b: Booking, caregiverId: string) => void;
  onSavePayment: (
    b: Booking,
    patch: { price: number | null; paymentStatus: PaymentStatus | null; paymentNotes: string },
  ) => Promise<void>;
}) {
  const users = useUsers();
  const parents = useParents();
  const caregivers = useCaregivers();
  const getCaregiver = useGetCaregiver();
  const getServiceType = useGetServiceType();
  const anak = users.find((u) => u.id === b.anakId);
  const p = b.parentId ? parents.find((x) => x.id === b.parentId) : undefined;
  const svc = getServiceType(b.serviceTypeId);
  const trans = TRANSPORT_MODES.find((t) => t.key === b.transport);
  const cg = getCaregiver(b.caregiverId);
  // Every active staff account can be assigned. The current assignee stays
  // listed even if their account was since deactivated.
  const assignable = caregivers.filter(
    (c) => c.status === "active" || c.id === b.caregiverId,
  );

  return (
    <div className="space-y-5 pb-6">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <DialogTitle className="font-display text-lg">
            {svc?.name}
          </DialogTitle>
          <BookingStatusPill status={b.status} />
        </div>
        <p className="text-xs text-muted-foreground">{svc?.description}</p>
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
          <Field label="Dihantar Pada" value={format(new Date(b.createdAt), "dd MMM yyyy, HH:mm")} />
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

      {/* Payment — admin sets the price, everyone else sees it read-only */}
      <PaymentSection booking={b} onSave={onSavePayment} />

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
                {[cg.specialization, cg.phone].filter(Boolean).join(" · ")}
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
              {assignable.map((c) => (
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

/** RM formatting used everywhere the price is shown. */
function formatRM(price?: number | null): string {
  return price == null ? "Belum ditetapkan" : `RM ${price.toFixed(2)}`;
}

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "belum_bayar", label: PAYMENT_STATUS_LABEL.belum_bayar },
  { value: "deposit", label: PAYMENT_STATUS_LABEL.deposit },
  { value: "telah_bayar", label: PAYMENT_STATUS_LABEL.telah_bayar },
];

const NO_PAYMENT_STATUS = "none";

function PaymentSection({
  booking: b,
  onSave,
}: {
  booking: Booking;
  onSave: (
    b: Booking,
    patch: { price: number | null; paymentStatus: PaymentStatus | null; paymentNotes: string },
  ) => Promise<void>;
}) {
  const { user } = useAuth();
  const canEdit = user?.role === "admin";

  const [price, setPrice] = useState(b.price != null ? String(b.price) : "");
  const [status, setStatus] = useState<string>(b.paymentStatus ?? NO_PAYMENT_STATUS);
  const [notes, setNotes] = useState(b.paymentNotes ?? "");
  const [saving, setSaving] = useState(false);

  // Re-seed when the refreshed booking arrives, or another one is opened.
  useEffect(() => {
    setPrice(b.price != null ? String(b.price) : "");
    setStatus(b.paymentStatus ?? NO_PAYMENT_STATUS);
    setNotes(b.paymentNotes ?? "");
  }, [b.id, b.price, b.paymentStatus, b.paymentNotes]);

  const trimmed = price.trim();
  const parsed = trimmed === "" ? null : Number(trimmed);
  const priceInvalid = parsed !== null && (!Number.isFinite(parsed) || parsed < 0);

  const save = async () => {
    if (priceInvalid) {
      toast.error("Harga mesti nombor yang sah dan tidak negatif.");
      return;
    }
    setSaving(true);
    try {
      await onSave(b, {
        price: parsed,
        paymentStatus: status === NO_PAYMENT_STATUS ? null : (status as PaymentStatus),
        paymentNotes: notes,
      });
      toast.success("Maklumat bayaran dikemas kini");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan bayaran.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section icon={<CreditCard className="h-3.5 w-3.5" />} title="Bayaran">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3">
        <span className="font-display text-lg font-bold">{formatRM(b.price)}</span>
        <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-border">
          {b.paymentStatus ? PAYMENT_STATUS_LABEL[b.paymentStatus] : "Belum Ditetapkan"}
        </span>
      </div>

      {canEdit ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="bayaran-harga">
                Harga (RM)
              </Label>
              <Input
                id="bayaran-harga"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Cth: 120.00"
                aria-invalid={priceInvalid || undefined}
              />
              {priceInvalid && (
                <p className="text-[11px] text-destructive">
                  Masukkan nombor yang sah dan tidak negatif.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status Bayaran</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PAYMENT_STATUS}>Belum Ditetapkan</SelectItem>
                  {PAYMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="bayaran-nota">
              Catatan Bayaran (pilihan)
            </Label>
            <Input
              id="bayaran-nota"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cth: Deposit RM50 telah diterima"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => void save()} disabled={saving || priceInvalid}>
              {saving ? "Menyimpan..." : b.price == null ? "Tetapkan Harga" : "Kemas Kini Harga"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Maklumat bayaran kekal walaupun status servis berubah.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {b.paymentNotes && (
            <p className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              {b.paymentNotes}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Hanya admin boleh menetapkan atau mengubah harga servis.
          </p>
        </div>
      )}

      {canEdit && b.paymentNotes && !notes && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Catatan sedia ada: {b.paymentNotes}
        </p>
      )}
    </Section>
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
