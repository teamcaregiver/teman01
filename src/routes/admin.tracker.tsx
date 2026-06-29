import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParents, useTrackers, useUsers } from "@/lib/data";
import type { TrackerRecord } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { VitalCharts } from "@/components/vital-charts";
import { format } from "date-fns";
import { Activity, Eye, HeartPulse, Pill, Utensils } from "lucide-react";

export const Route = createFileRoute("/admin/tracker")({
  component: TrackerAdmin,
});

type Category = "all" | "vital" | "ubat" | "makan" | "checklist" | "laporan";

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "all", label: "Semua kategori" },
  { key: "vital", label: "Tanda Vital" },
  { key: "ubat", label: "Ubatan" },
  { key: "makan", label: "Makanan" },
  { key: "checklist", label: "Senarai Semak" },
  { key: "laporan", label: "Laporan Harian" },
];

const hasVital = (t: TrackerRecord) =>
  (t.vitalEntries?.length ?? 0) > 0 || t.bpSystolic != null;
const hasUbat = (t: TrackerRecord) =>
  (t.ubatanEntries ?? []).some((u) => u.items.length > 0);
const hasMakan = (t: TrackerRecord) =>
  (t.makananEntries ?? []).some((m) => m.jenisMakanan || m.jenisMinum);
const hasChecklist = (t: TrackerRecord) => (t.checklist?.length ?? 0) > 0;
const hasLaporan = (t: TrackerRecord) => !!t.aktiviti;

function matchesCategory(t: TrackerRecord, c: Category): boolean {
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

function TrackerAdmin() {
  const parents = useParents();
  const trackers = useTrackers();
  const users = useUsers();
  const [pid, setPid] = useState("all");
  const [sid, setSid] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const rows = useMemo(() => {
    return trackers
      .filter((t) => pid === "all" || t.parentId === pid)
      .filter((t) => sid === "all" || t.staffId === sid)
      .filter((t) => !from || t.date.slice(0, 10) >= from)
      .filter((t) => !to || t.date.slice(0, 10) <= to)
      .filter((t) => matchesCategory(t, category))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [trackers, pid, sid, from, to, category]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      normal: rows.filter((t) => t.status === "normal").length,
      attention: rows.filter((t) => t.status === "attention").length,
      critical: rows.filter((t) => t.status === "critical").length,
    }),
    [rows],
  );

  const showCharts =
    (category === "all" || category === "vital") &&
    rows.some((t) => (t.vitalEntries?.length ?? 0) > 0);

  const resetFilters = () => {
    setPid("all");
    setSid("all");
    setFrom("");
    setTo("");
    setCategory("all");
  };

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
        <SummaryCard label="Jumlah Rekod" value={summary.total} tone="muted" />
        <SummaryCard label="Normal" value={summary.normal} tone="normal" />
        <SummaryCard
          label="Perlu Perhatian"
          value={summary.attention}
          tone="attention"
        />
        <SummaryCard
          label="Kritikal"
          value={summary.critical}
          tone="critical"
        />
      </div>

      {/* Filters */}
      <Card className="border-border/60 p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Warga Emas</Label>
            <Select value={pid} onValueChange={setPid}>
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
            <Select value={sid} onValueChange={setSid}>
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
              onValueChange={(v) => setCategory(v as Category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.key} value={c.key}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Dari Tarikh</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hingga Tarikh</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" className="w-full" onClick={resetFilters}>
              Set Semula Penapis
            </Button>
          </div>
        </div>
      </Card>

      {/* Charts */}
      {showCharts && (
        <div>
          <h2 className="mb-2 font-display text-lg font-bold">
            Graf Tanda Vital
          </h2>
          <p className="mb-2 text-xs text-muted-foreground">
            Ringkasan bacaan tanda vital bagi rekod yang ditapis.
          </p>
          <VitalCharts records={rows} />
        </div>
      )}

      {/* Records table (view only) */}
      <Card className="overflow-hidden border-border/60 p-0">
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
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Tiada rekod sepadan dengan penapis.
                </TableCell>
              </TableRow>
            )}
            {rows.map((t) => {
              const p = parents.find((x) => x.id === t.parentId);
              const s = users.find((x) => x.id === t.staffId);
              return (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {format(new Date(t.date), "dd MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">{p?.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s?.name}
                  </TableCell>
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
                  <TableCell className="text-sm">
                    {t.bpSystolic ? `${t.bpSystolic}/${t.bpDiastolic}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.bloodSugar ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/admin/rekod-harian/$recordId"
                        params={{ recordId: t.id }}
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
  attention: <Pill className="h-4 w-4 text-status-attention" />,
  critical: <Utensils className="h-4 w-4 text-status-critical" />,
};

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "muted" | "normal" | "attention" | "critical";
}) {
  return (
    <Card className="border-border/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {TONE_ICON[tone]}
      </div>
      <p className={`mt-2 font-display text-2xl font-bold ${TONE_CLS[tone]}`}>
        {value}
      </p>
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
