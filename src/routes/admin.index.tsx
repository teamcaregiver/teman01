import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { StatCard } from "@/components/stat-card";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { BookingStatusPill } from "@/components/booking-status-pill";
import {
  useArticles,
  useGetServiceType,
  useOpenBookingsQuery,
  useParentsQuery,
  useTrackersQuery,
  useUsers,
  useVideos,
} from "@/lib/data";
import type { DateRange } from "@/lib/data";
import type { Parent, TrackerRecord } from "@/lib/mock-data";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Heart,
  HeartHandshake,
  Inbox,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

// ---- record date filters ----
type FilterKey = "today" | "week" | "month" | "custom";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "week", label: "7 Hari Lalu" },
  { key: "month", label: "Bulan Ini" },
  { key: "custom", label: "Tarikh Tersuai" },
];

/**
 * Turn the active filter into the ISO window sent to the records query.
 * Custom dates are inclusive (whole start day .. whole end day) and are
 * swapped when the admin picks them the wrong way round.
 */
function rangeFor(key: FilterKey, from: string, to: string): DateRange {
  const now = new Date();
  if (key === "today")
    return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
  if (key === "week")
    return { from: startOfDay(subDays(now, 6)).toISOString(), to: endOfDay(now).toISOString() };
  if (key === "month")
    return { from: startOfMonth(now).toISOString(), to: endOfMonth(now).toISOString() };

  const a = from ? startOfDay(new Date(from)) : undefined;
  const b = to ? endOfDay(new Date(to)) : undefined;
  if (a && b && a > b)
    return {
      from: startOfDay(new Date(to)).toISOString(),
      to: endOfDay(new Date(from)).toISOString(),
    };
  return { from: a?.toISOString(), to: b?.toISOString() };
}

function rangeLabel(key: FilterKey, from: string, to: string): string {
  const now = new Date();
  if (key === "today") return format(now, "dd MMM yyyy");
  if (key === "week")
    return `${format(subDays(now, 6), "dd MMM")} – ${format(now, "dd MMM yyyy")}`;
  if (key === "month") return format(now, "MMMM yyyy");
  if (from && to) {
    const [a, b] = new Date(from) <= new Date(to) ? [from, to] : [to, from];
    return `${format(new Date(a), "dd MMM")} – ${format(new Date(b), "dd MMM yyyy")}`;
  }
  if (from) return `Dari ${format(new Date(from), "dd MMM yyyy")}`;
  if (to) return `Hingga ${format(new Date(to), "dd MMM yyyy")}`;
  return "Semua tarikh";
}

/** Short vital reading summary (falls back to the legacy flat fields). */
function readingSummary(t: TrackerRecord): string {
  const v = t.vitalEntries?.[t.vitalEntries.length - 1];
  const sys = v?.bpSistolik ?? t.bpSystolic;
  const dia = v?.bpDiastolik ?? t.bpDiastolic;
  const gula = v?.gulaDarah ?? t.bloodSugar;
  const parts: string[] = [];
  if (sys != null || dia != null) parts.push(`TD ${sys ?? "-"}/${dia ?? "-"}`);
  if (gula != null) parts.push(`Gula ${gula}`);
  return parts.join(" · ");
}

const initialsOf = (name: string) =>
  name.split(" ").slice(0, 2).map((n) => n[0]).join("");

function AdminHome() {
  const articles = useArticles();
  const videos = useVideos();
  const users = useUsers();
  const getServiceType = useGetServiceType();

  const [filter, setFilter] = useState<FilterKey>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(
    () => rangeFor(filter, customFrom, customTo),
    [filter, customFrom, customTo],
  );

  const parentsQ = useParentsQuery();
  const recordsQ = useTrackersQuery(range);
  const bookingsQ = useOpenBookingsQuery();

  const parents = useMemo(() => parentsQ.data ?? [], [parentsQ.data]);
  const records = useMemo(
    () => [...(recordsQ.data ?? [])].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [recordsQ.data],
  );
  const shown = records.slice(0, 6);

  const parentById = useMemo(() => {
    const map: Record<string, Parent> = {};
    parents.forEach((p) => (map[p.id] = p));
    return map;
  }, [parents]);

  const openBookings = bookingsQ.data ?? [];
  const pendingCount = openBookings.filter((b) => b.status === "pending").length;
  const newestRequests = openBookings.slice(0, 4);

  const period = rangeLabel(filter, customFrom, customTo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Selamat datang, Admin</h1>
        <p className="text-sm text-muted-foreground">Ringkasan sistem penjagaan hari ini.</p>
      </div>

      <StaggerList>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <StatCard
              tone="teal"
              label="Warga Emas"
              value={parentsQ.isPending ? "—" : parents.length}
              icon={<Heart className="h-4 w-4" />}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              tone="sage"
              label="Staf Aktif"
              value={users.filter((u) => u.role === "staff" && u.status === "active").length}
              icon={<Users className="h-4 w-4" />}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              tone="peach"
              label={filter === "today" ? "Rekod Hari Ini" : "Rekod Harian"}
              value={recordsQ.isPending ? "—" : records.length}
              hint={period}
              icon={<Activity className="h-4 w-4" />}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              tone="lavender"
              label="Kandungan"
              value={articles.length + videos.length}
              icon={<BookOpen className="h-4 w-4" />}
            />
          </StaggerItem>
        </div>
      </StaggerList>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ---- Latest records ---- */}
        <Card className="border-border/60 p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Rekod terkini</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {recordsQ.isPending ? "Memuatkan…" : `${records.length} rekod`} · {period}
              </p>
            </div>
            <div
              role="group"
              aria-label="Tapis rekod mengikut tarikh"
              className="flex flex-wrap gap-1.5"
            >
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filter === "custom" && (
            <div className="mb-4 grid gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rekod-dari" className="text-xs">
                  Tarikh mula
                </Label>
                <Input
                  id="rekod-dari"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rekod-hingga" className="text-xs">
                  Tarikh tamat
                </Label>
                <Input
                  id="rekod-hingga"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>
          )}

          {recordsQ.isPending ? (
            <RowSkeletons />
          ) : recordsQ.isError ? (
            <ErrorState
              message={(recordsQ.error as Error).message}
              onRetry={() => void recordsQ.refetch()}
            />
          ) : shown.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-5 w-5" />}
              title="Tiada rekod untuk tempoh ini"
              hint="Cuba pilih julat tarikh yang lain atau semak semula nanti."
            />
          ) : (
            <>
              <div className="divide-y divide-border">
                {shown.map((t) => {
                  const p = parentById[t.parentId];
                  const reading = readingSummary(t);
                  const meta = `${format(new Date(t.date), "dd MMM yyyy, HH:mm")}${
                    reading ? ` · ${reading}` : ""
                  }`;
                  const body = (
                    <>
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-peach text-xs font-bold text-peach-foreground">
                        {p ? initialsOf(p.fullName) : "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {p?.fullName ?? "Warga emas tidak dikenali"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{meta}</p>
                      </div>
                      <StatusBadge status={t.status} />
                    </>
                  );

                  // Only rows with a resolved elderly resident can navigate.
                  return p ? (
                    <Link
                      key={t.id}
                      to="/admin/warga-emas/$parentId"
                      params={{ parentId: p.id }}
                      aria-label={`Lihat profil ${p.fullName} — rekod ${meta}`}
                      className="-mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {body}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ) : (
                    <div key={t.id} className="-mx-2 flex items-center gap-3 px-2 py-3">
                      {body}
                      <span className="w-4 shrink-0" />
                    </div>
                  );
                })}
              </div>
              {records.length > shown.length && (
                <div className="mt-4 flex justify-center">
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/admin/tracker">
                      Lihat semua {records.length} rekod
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ---- Service requests ---- */}
        <Card className="border-border/60 p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Permintaan Servis</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {bookingsQ.isPending ? "Memuatkan…" : `${pendingCount} menunggu pengesahan`}
              </p>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-teal text-teal-foreground">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>

          {!bookingsQ.isPending && !bookingsQ.isError && (
            <p className="mb-4 font-display text-3xl font-bold">{openBookings.length}</p>
          )}

          {bookingsQ.isPending ? (
            <RowSkeletons rows={3} />
          ) : bookingsQ.isError ? (
            <ErrorState
              message={(bookingsQ.error as Error).message}
              onRetry={() => void bookingsQ.refetch()}
            />
          ) : newestRequests.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-5 w-5" />}
              title="Tiada permintaan menunggu"
              hint="Semua tempahan servis telah diselesaikan."
            />
          ) : (
            <div className="divide-y divide-border">
              {newestRequests.map((b) => {
                const p = b.parentId ? parentById[b.parentId] : undefined;
                const anak = users.find((u) => u.id === b.anakId);
                const svc = getServiceType(b.serviceTypeId);
                const who = p?.fullName ?? anak?.name ?? "Tanpa nama";
                return (
                  <Link
                    key={b.id}
                    to="/admin/servis"
                    aria-label={`Buka Servis Monitoring untuk permintaan ${
                      svc?.name ?? "servis"
                    } — ${who}`}
                    className="-mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{who}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {svc?.name ?? "Servis"}
                        {b.date &&` · ${format(new Date(b.date), "dd MMM yyyy")}`}
                      </p>
                    </div>
                    <BookingStatusPill status={b.status} />
                  </Link>
                );
              })}
            </div>
          )}

          {!bookingsQ.isError && (
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/admin/servis">
                Lihat Semua
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}

// ---- shared states ----
function RowSkeletons({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 px-4 py-10 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full gradient-sage text-sage-foreground">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-status-critical/5 px-4 py-10 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-status-critical/15 text-status-critical">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium">Gagal memuatkan data</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        <RefreshCw className="mr-1 h-4 w-4" /> Cuba lagi
      </Button>
    </div>
  );
}
