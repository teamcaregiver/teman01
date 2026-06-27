import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  parents, bookings, getCaregiver,
  SERVICE_TYPES, TRANSPORT_MODES, BOOKING_STATUS_LABEL, PAYMENT_STATUS_LABEL,
} from "@/lib/mock-data";
import type { Booking, Caregiver, ServiceType, TransportMode, BookingStatus } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarClock, Car, MapPin, HeartHandshake, Stethoscope, Plus, ChevronLeft,
  Phone, Star, UserCog, CreditCard, ClipboardList, Hourglass, Ban,
} from "lucide-react";
import { StaggerItem, StaggerList } from "@/components/page-transition";

export const Route = createFileRoute("/anak/service")({
  component: ServicePage,
});

const statusTone: Record<BookingStatus, string> = {
  pending: "bg-status-attention/15 text-status-attention",
  confirmed: "bg-teal/20 text-teal-foreground",
  ongoing: "bg-primary/15 text-primary",
  completed: "bg-status-normal/15 text-status-normal",
  cancelled: "bg-muted text-muted-foreground",
};

type Bucket = "upcoming" | "ongoing" | "completed" | "cancelled";

const TABS: { key: Bucket; label: string }[] = [
  { key: "upcoming", label: "Akan Datang" },
  { key: "ongoing", label: "Sedang Berlangsung" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

const EMPTY_LABEL: Record<Bucket, string> = {
  upcoming: "Tiada tempahan akan datang.",
  ongoing: "Tiada servis yang sedang berlangsung.",
  completed: "Belum ada tempahan yang selesai.",
  cancelled: "Tiada tempahan dibatalkan.",
};

function bucketOf(b: Booking): Bucket {
  if (b.status === "cancelled") return "cancelled";
  if (b.status === "completed") return "completed";
  if (b.status === "ongoing") return "ongoing";
  return "upcoming"; // pending / confirmed
}

function ServicePage() {
  const { user } = useAuth();
  const myParents = parents.filter(p => p.anakIds.includes(user?.id ?? ""));

  const [view, setView] = useState<"history" | "form">("history");
  const [tab, setTab] = useState<Bucket>("upcoming");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [, force] = useState(0);

  if (view === "form") {
    return (
      <BookingForm
        userId={user?.id ?? ""}
        myParents={myParents}
        onCancel={() => setView("history")}
        onCreated={() => { force(n => n + 1); setTab("upcoming"); setView("history"); }}
      />
    );
  }

  const myBookings = bookings
    .filter(b => b.anakId === user?.id)
    .sort((a, b) => +new Date(`${b.date}T${b.time}`) - +new Date(`${a.date}T${a.time}`));

  const filtered = myBookings.filter(b => bucketOf(b) === tab);

  const cancelBooking = (b: Booking) => {
    b.status = "cancelled";
    force(n => n + 1);
    setSelected(null);
    setTab("cancelled");
    toast.success("Tempahan dibatalkan.");
  };

  const rescheduleBooking = (b: Booking, date: string, time: string) => {
    b.date = date;
    b.time = time;
    force(n => n + 1);
    toast.success("Tempahan dijadualkan semula.");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">Tempah Servis</h1>
          <p className="text-sm text-muted-foreground">Urus & pantau tempahan servis untuk orang tersayang.</p>
        </div>
        <Button onClick={() => setView("form")} className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" /> Tambah Tempahan
        </Button>
      </div>

      {/* Status tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as Bucket)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          {TABS.map(t => {
            const n = myBookings.filter(b => bucketOf(b) === t.key).length;
            return (
              <TabsTrigger key={t.key} value={t.key} className="text-xs">
                {t.label}{n > 0 && <span className="ml-1 text-[10px] opacity-70">({n})</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Booking history list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          {EMPTY_LABEL[tab]}
        </Card>
      ) : (
        <StaggerList>
          <div className="space-y-3">
            {filtered.map(b => (
              <StaggerItem key={b.id}>
                <BookingCard booking={b} onClick={() => setSelected(b)} />
              </StaggerItem>
            ))}
          </div>
        </StaggerList>
      )}

      <BookingDialog
        booking={selected}
        onClose={() => setSelected(null)}
        onCancelBooking={cancelBooking}
        onReschedule={rescheduleBooking}
      />
    </div>
  );
}

// ---- Booking card (history item) ----
function BookingCard({ booking: b, onClick }: { booking: Booking; onClick: () => void }) {
  const p = b.parentId ? parents.find(x => x.id === b.parentId) : undefined;
  const svc = SERVICE_TYPES.find(s => s.key === b.serviceType);
  const cg = getCaregiver(b.caregiverId);

  return (
    <Card
      onClick={onClick}
      className="hover-lift cursor-pointer border-border/60 p-4"
    >
      <div className="flex items-center gap-2">
        <p className="font-display font-semibold">{svc?.label}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone[b.status]}`}>
          {BOOKING_STATUS_LABEL[b.status]}
        </span>
      </div>
      {p && <p className="text-xs text-muted-foreground">Untuk: {p.fullName}</p>}
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" /> {format(new Date(`${b.date}T${b.time}`), "dd MMM yyyy · HH:mm")}
        </p>
        <p className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {b.location}</p>
      </div>

      {/* Caregiver assignment summary */}
      <div className="mt-3 border-t border-border/60 pt-3">
        {cg ? (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={cg.avatar} alt={cg.name} />
              <AvatarFallback className="text-[10px]">{initials(cg.name)}</AvatarFallback>
            </Avatar>
            <p className="min-w-0 truncate text-xs font-medium">{cg.name}</p>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-status-attention">
            <Hourglass className="h-3.5 w-3.5" /> Menunggu admin menetapkan caregiver
          </p>
        )}
      </div>
    </Card>
  );
}

// ---- Booking detail popup ----
function BookingDialog({ booking: b, onClose, onCancelBooking, onReschedule }: {
  booking: Booking | null;
  onClose: () => void;
  onCancelBooking: (b: Booking) => void;
  onReschedule: (b: Booking, date: string, time: string) => void;
}) {
  const p = b?.parentId ? parents.find(x => x.id === b.parentId) : undefined;
  const svc = b ? SERVICE_TYPES.find(s => s.key === b.serviceType) : undefined;
  const trans = b ? TRANSPORT_MODES.find(t => t.key === b.transport) : undefined;
  const cg = getCaregiver(b?.caregiverId);

  const [reschedule, setReschedule] = useState(false);
  const [rDate, setRDate] = useState("");
  const [rTime, setRTime] = useState("");
  useEffect(() => {
    setReschedule(false);
    setRDate(b?.date ?? "");
    setRTime(b?.time ?? "");
  }, [b?.id]);

  // Actions are only available for upcoming bookings.
  const canAct = !!b && bucketOf(b) === "upcoming";
  const hasCaregiver = !!cg;

  return (
    <Dialog open={!!b} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {b && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>{svc?.label}</DialogTitle>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone[b.status]}`}>
                  {BOOKING_STATUS_LABEL[b.status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{svc?.desc}</p>
            </DialogHeader>

            <div className="space-y-4">
              {/* Service details */}
              <Section icon={<ClipboardList className="h-3.5 w-3.5" />} title="Butiran Servis">
                <div className="space-y-2 text-xs">
                  <Row icon={<CalendarClock className="h-3.5 w-3.5" />} label="Tarikh & Masa" value={format(new Date(`${b.date}T${b.time}`), "EEEE, dd MMM yyyy · HH:mm")} />
                  {p && <Row icon={<HeartHandshake className="h-3.5 w-3.5" />} label="Warga Emas" value={p.fullName} />}
                  <Row icon={<Car className="h-3.5 w-3.5" />} label="Pengangkutan" value={trans?.label ?? "-"} />
                  <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Lokasi" value={b.location} />
                </div>
              </Section>

              {/* Payment */}
              {(b.price != null || b.paymentStatus) && (
                <Section icon={<CreditCard className="h-3.5 w-3.5" />} title="Pembayaran">
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
                    <span className="font-semibold">{b.price != null ? `RM ${b.price.toFixed(2)}` : "—"}</span>
                    {b.paymentStatus && (
                      <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-border">
                        {PAYMENT_STATUS_LABEL[b.paymentStatus]}
                      </span>
                    )}
                  </div>
                </Section>
              )}

              {/* Caregiver */}
              <Section icon={<UserCog className="h-3.5 w-3.5" />} title="Caregiver">
                {cg ? <CaregiverBlock caregiver={cg} /> : <CaregiverPending />}
              </Section>

              {/* Notes */}
              {b.notes && (
                <Section icon={<ClipboardList className="h-3.5 w-3.5" />} title="Catatan / Permintaan Khas">
                  <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground whitespace-pre-wrap">{b.notes}</p>
                </Section>
              )}

              {/* Actions: no caregiver → boleh batal; ada caregiver → hanya boleh jadual semula */}
              {canAct && (
                <div className="border-t border-border pt-4">
                  {reschedule ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold">Jadual Semula</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tarikh</Label>
                          <Input type="date" value={rDate} onChange={e => setRDate(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Masa</Label>
                          <Input type="time" value={rTime} onChange={e => setRTime(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setReschedule(false)}>Batal</Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!rDate || !rTime) { toast.error("Sila pilih tarikh dan masa."); return; }
                            onReschedule(b, rDate, rTime);
                            setReschedule(false);
                          }}
                        >
                          Simpan
                        </Button>
                      </div>
                    </div>
                  ) : hasCaregiver ? (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" onClick={() => setReschedule(true)}>
                        <CalendarClock className="mr-1.5 h-4 w-4" /> Jadual Semula
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground">
                        Caregiver telah ditetapkan — tempahan tidak boleh dibatalkan, hanya boleh dijadualkan semula.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button variant="destructive" className="w-full" onClick={() => onCancelBooking(b)}>
                        <Ban className="mr-1.5 h-4 w-4" /> Batalkan Tempahan
                      </Button>
                      <p className="text-center text-[11px] text-muted-foreground">
                        Tempahan boleh dibatalkan kerana caregiver belum ditetapkan.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---- Caregiver display ----
function CaregiverBlock({ caregiver: cg }: { caregiver: Caregiver }) {
  return (
    <div className="rounded-xl border border-border/60 p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={cg.avatar} alt={cg.name} />
          <AvatarFallback>{initials(cg.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold">{cg.name}</p>
          <p className="text-xs text-muted-foreground">{cg.specialization}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-status-attention">
              <Star className="h-3 w-3 fill-current" /> {cg.rating.toFixed(1)}
            </span>
            <span>{cg.experienceYears} tahun pengalaman</span>
          </div>
        </div>
      </div>
      <a
        href={`tel:${cg.phone.replace(/\s/g, "")}`}
        className="mt-3 flex items-center gap-1.5 rounded-lg bg-muted/40 px-3 py-2 text-xs font-medium hover:bg-muted"
      >
        <Phone className="h-3.5 w-3.5" /> {cg.phone}
      </a>
      {cg.notes && <p className="mt-2 text-[11px] italic text-muted-foreground">{cg.notes}</p>}
    </div>
  );
}

function CaregiverPending() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-status-attention/40 bg-status-attention/5 p-3">
      <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-status-attention" />
      <div>
        <p className="text-sm font-medium text-status-attention">Caregiver belum ditetapkan</p>
        <p className="text-xs text-muted-foreground">Menunggu admin menetapkan caregiver untuk tempahan ini.</p>
      </div>
    </div>
  );
}

// ---- New booking form (shown only after "Tambah Tempahan") ----
function BookingForm({ userId, myParents, onCancel, onCreated }: {
  userId: string;
  myParents: typeof parents;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [serviceType, setServiceType] = useState<ServiceType>("companion");
  const [parentId, setParentId] = useState<string>(myParents[0]?.id ?? "none");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [transport, setTransport] = useState<TransportMode>("hantar");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !location.trim()) {
      toast.error("Sila lengkapkan tarikh, masa dan lokasi.");
      return;
    }
    const booking: Booking = {
      id: `b-${Date.now()}`,
      anakId: userId,
      parentId: parentId === "none" ? undefined : parentId,
      serviceType, date, time, transport,
      location, notes: notes || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    bookings.unshift(booking);
    toast.success("Tempahan dihantar. Menunggu pengesahan admin.");
    onCreated();
  };

  return (
    <div className="space-y-5">
      <button onClick={onCancel} className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Kembali ke tempahan
      </button>
      <div>
        <h1 className="font-display text-xl font-bold">Tempah Servis Baharu</h1>
        <p className="text-sm text-muted-foreground">Pilih servis Companion atau Care untuk orang tersayang.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/60 p-4 space-y-4">
          {/* Service type cards */}
          <div>
            <Label className="text-xs">Jenis Servis</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {SERVICE_TYPES.map(s => {
                const active = serviceType === s.key;
                const Icon = s.key === "companion" ? HeartHandshake : Stethoscope;
                return (
                  <button
                    type="button"
                    key={s.key}
                    onClick={() => setServiceType(s.key)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="mt-2 font-display font-semibold">{s.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Elderly (optional) */}
          <Field label="Untuk Warga Emas (pilihan)">
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Pilih warga emas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tiada / belum berdaftar</SelectItem>
                {myParents.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          {/* Date & time */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tarikh"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
            <Field label="Masa"><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
          </div>

          {/* Transport */}
          <Field label="Pengangkutan">
            <Select value={transport} onValueChange={v => setTransport(v as TransportMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSPORT_MODES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Lokasi / Alamat">
            <Textarea rows={2} value={location} onChange={e => setLocation(e.target.value)} placeholder="Alamat penuh untuk servis dijalankan" />
          </Field>

          <Field label="Catatan (pilihan)">
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Keperluan khas, masa tambahan, dll." />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Batal</Button>
            <Button type="submit">Hantar Tempahan</Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{icon} {title}</p>
      {children}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
}
