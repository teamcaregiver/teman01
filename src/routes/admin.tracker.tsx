import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParents, useTrackersQuery, useUsers } from "@/lib/data";
import type { TrackerRecord } from "@/lib/mock-data";
import {
  TRACKER_CATEGORIES,
  validateTrackerSearch,
} from "@/lib/tracker-filters";
import type { TrackerCategory, TrackerSearch } from "@/lib/tracker-filters";
import { StatusBadge } from "@/components/status-badge";
import { endOfDay, format, startOfDay } from "date-fns";
import { Activity, AlertTriangle, Eye, HeartPulse, Siren } from "lucide-react";

export const Route = createFileRoute("/admin/tracker")({
  validateSearch: validateTrackerSearch,
  component: TrackerAdmin,
});

const hasVital = (t: TrackerRecord) =>
  (t.vitalEntries?.length ?? 0) > 0 || t.bpSystolic != null;
const hasUbat = (t: TrackerRecord) =>
  (t.ubatanEntries ?? []).some((u) => u.items.length > 0);
const hasMakan = (t: TrackerRecord) =>
  (t.makananEntries ?? []).some((m) => m.jenisMakanan || m.jenisMinum);
const hasChecklist = (t: TrackerRecord) => (t.checklist?.length ?? 0) > 0;
const hasLaporan = (t: TrackerRecord) => !!t.aktiviti;

function matchesCategory(t: TrackerRecord, c: TrackerCategory): boolean {
  switch (c) {
    case "vital":
      return hasVital(t);
    case "ubat":
      return hasUbat(t);
    case "makan":
      return hasMakan(t);
    case "checklist":
      return hasChecklist(t);
    case "laporan":
      return hasLaporan(t);
    default:
      return true;
  }
}

/** Latest reading in a record, falling back to the legacy flat columns. */
function latestVital(t: TrackerRecord) {
  const v = t.vitalEntries?.[t.vitalEntries.length - 1];
  return {
    sys: v?.bpSistolik ?? t.bpSystolic,
    dia: v?.bpDiastolik ?? t.bpDiastolic,
    gula: v?.gulaDarah ?? t.bloodSugar,
  };
}

const TABLE_COLS = 8;

function TrackerAdmin() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/tracker" });

  const parents = useParents();
  const users = useUsers();

  const pid = search.pid ?? "all";
  const sid = search.sid ?? "all";
  const category = search.category ?? "all";
  const from = search.from ?? "";
  const to = search.to ?? "";

  const setFilter = (patch: Partial<TrackerSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  // The date window is pushed into the query; the rest is filtered client-side.
  const range = useMemo(
    () => ({
      from: from ? startOfDay(new Date(from)).toISOString() : undefined,
      to: to ? endOfDay(new Date(to)).toISOString() : undefined,
    }),
    [from, to],
  );
  const trackersQ = useTrackersQuery(range);

  const rows = useMemo(() => {
    return (trackersQ.data ?? [])
      .filter((t) => pid === "all" || t.parentId === pid)
      .filter((t) => sid === "all" || t.staffId === sid)
      .filter((t) => matchesCategory(t, category))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [trackersQ.data, pid, sid, category]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      normal: rows.filter((t) => t.status === "normal").length,
      attention: rows.filter((t) => t.status === "attention").length,
      critical: rows.filter((t) => t.status === "critical").length,
    }),
    [rows],
  );

  const filtersActive =
    pid !== "all" || sid !== "all" || category !== "all" || !!from || !!to;

  const resetFilters = () => navigate({ search: {}, replace: true });

  const openRecord = (recordId: string) =>
    navigate({
      to: "/admin/rekod-harian/$recordId",
      params: { recordId },
      search,
    });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Rekod Harian</h1>
        <p className="text-sm text-muted-foreground">
          Pantau keseluruhan rekod penjagaan harian merentas semua warga emas
          (paparan sahaja).
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Jumlah Rekod"
          value={summary.total}
          tone="muted"
          loading={trackersQ.isPending}
        />
        <SummaryCard
          label="Normal"
          value={summary.normal}
          tone="normal"
          loading={trackersQ.isPending}
        />
        <SummaryCard
          label="Perlu Perhatian"
          value={summary.attention}
          tone="attention"
          loading={trackersQ.isPending}
        />
        <SummaryCard
          label="Kritikal"
          value={summary.critical}
          tone="critical"
          loading={trackersQ.isPending}
        />
      </div>

      {/* Filters */}
      <Card className="border-border/60 p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Warga Emas</Label>
            <Select
              value={pid}
              onValueChange={(v) => setFilter({ pid: v === "all" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Warga emas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua warga emas</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Caregiver / Staf</Label>
            <Select
              value={sid}
              onValueChange={(v) => setFilter({ sid: v === "all" ? undefined : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Staf" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua staf</SelectItem>
                {users
                  .filter((u) => u.role === "staff")
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Kategori Data</Label>
            <Select
              value={category}
              onValueChange={(v) =>
                setFilter({
                  category: v === "all" ? undefined : (v as TrackerCategory),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACKER_CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="rekod-dari">
              Dari Tarikh
            </Label>
            <Input
              id="rekod-dari"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFilter({ from: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="rekod-hingga">
              Hingga Tarikh
            </Label>
            <Input
              id="rekod-hingga"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setFilter({ to: e.target.value || undefined })}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="w-full"
              onClick={resetFilters}
              disabled={!filtersActive}
            >
              Set Semula Penapis
            </Button>
          </div>
        </div>
      </Card>

      {/* Records table (view only) */}
      <Card className="overflow-hidden border-border/60 p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Tarikh</TableHead>
                <TableHead>Warga Emas</TableHead>
                <TableHead>Staf</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kandungan</TableHead>
                <TableHead>TD</TableHead>
                <TableHead>Gula</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackersQ.isPending &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`s${i}`} className="hover:bg-transparent">
                    <TableCell colSpan={TABLE_COLS}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {trackersQ.isError && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={TABLE_COLS} className="py-10 text-center">
                    <p className="text-sm font-medium">Gagal memuatkan rekod</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(trackersQ.error as Error).message}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => void trackersQ.refetch()}
                    >
                      Cuba lagi
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!trackersQ.isPending && !trackersQ.isError && rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={TABLE_COLS} className="py-10 text-center">
                    <p className="text-sm font-medium">
                      {filtersActive ? "Tiada rekod sepadan" : "Tiada rekod lagi"}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                      {filtersActive
                        ? "Cuba longgarkan penapis atau pilih julat tarikh yang lain."
                        : "Rekod penjagaan harian akan dipaparkan di sini sebaik sahaja staf menghantarnya."}
                    </p>
                    {filtersActive && (
                      <Button size="sm" variant="outline" className="mt-3" onClick={resetFilters}>
                        Set Semula Penapis
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {rows.map((t) => {
                const p = parents.find((x) => x.id === t.parentId);
                const s = users.find((x) => x.id === t.staffId);
                const { sys, dia, gula } = latestVital(t);
                const who = p?.fullName ?? "Warga emas tidak dikenali";
                return (
                  <TableRow
                    key={t.id}
                    tabIndex={0}
                    aria-label={`Lihat rekod ${who} pada ${format(new Date(t.date), "dd MMM yyyy, HH:mm")}`}
                    className="cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
                    onClick={(e) => {
                      // Let buttons / links / inputs inside the row act normally.
                      if ((e.target as HTMLElement).closest("a,button,input,[role='checkbox']")) {
                        return;
                      }
                      openRecord(t.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openRecord(t.id);
                      }
                    }}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(t.date), "dd MMM yyyy, HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">{p?.fullName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s?.name ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {hasVital(t) && <DataBadge label="Vital" />}
                        {hasUbat(t) && <DataBadge label="Ubat" />}
                        {hasMakan(t) && <DataBadge label="Makan" />}
                        {hasChecklist(t) && <DataBadge label="Checklist" />}
                        {hasLaporan(t) && <DataBadge label="Laporan" />}
                        {(t.gambar?.length ?? 0) > 0 && (
                          <DataBadge label={`${t.gambar!.length} Foto`} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {sys != null || dia != null ? `${sys ?? "—"}/${dia ?? "—"}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{gula ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          to="/admin/rekod-harian/$recordId"
                          params={{ recordId: t.id }}
                          search={search}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" /> Lihat
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

const TONE_CLS: Record<string, string> = {
  muted: "text-foreground",
  normal: "text-status-normal",
  attention: "text-status-attention",
  critical: "text-status-critical",
};

const TONE_ICON: Record<string, React.ReactNode> = {
  muted: <Activity className="h-4 w-4 text-muted-foreground" />,
  normal: <HeartPulse className="h-4 w-4 text-status-normal" />,
  attention: <AlertTriangle className="h-4 w-4 text-status-attention" />,
  critical: <Siren className="h-4 w-4 text-status-critical" />,
};

function SummaryCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: number;
  tone: "muted" | "normal" | "attention" | "critical";
  loading?: boolean;
}) {
  return (
    <Card className="border-border/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {TONE_ICON[tone]}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className={`mt-2 font-display text-2xl font-bold ${TONE_CLS[tone]}`}>{value}</p>
      )}
    </Card>
  );
}

function DataBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="text-[10px] font-normal">
      {label}
    </Badge>
  );
}
