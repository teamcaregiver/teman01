import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { parents, trackers, DEFAULT_CHECKLIST } from "@/lib/mock-data";
import {
  todayRecord,
  setChecklist,
  setCatatanKhas,
} from "@/lib/tracker-actions";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { ElderlyInfoDialog } from "@/components/elderly-info-dialog";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { useState } from "react";
import {
  HeartPulse,
  Pill,
  Utensils,
  ClipboardList,
  Clock,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/staf/tracker/$parentId/")({
  component: TrackerHome,
});

const ACTIONS = [
  { to: "/staf/tracker/$parentId/vital", label: "Vital", icon: HeartPulse },
  { to: "/staf/tracker/$parentId/ubat", label: "Ubat", icon: Pill },
  {
    to: "/staf/tracker/$parentId/makanan",
    label: "Makanan dan Minuman",
    icon: Utensils,
  },
  {
    to: "/staf/tracker/$parentId/aktiviti",
    label: "Laporan Aktiviti Harian",
    icon: ClipboardList,
  },
] as const;

function TrackerHome() {
  const { parentId } = useParams({ from: "/staf/tracker/$parentId/" });
  const { user } = useAuth();
  const parent = parents.find((p) => p.id === parentId);
  const staffId = user?.id ?? "";

  const today = todayRecord(parentId, staffId);

  const [tab, setTab] = useState<"rekod" | "checklist">("rekod");
  const [checklist, setLocalChecklist] = useState(() =>
    today?.checklist?.length
      ? today.checklist.map((c) => ({ ...c }))
      : DEFAULT_CHECKLIST.map((c) => ({ ...c, done: false })),
  );
  const [catatan, setLocalCatatan] = useState(today?.catatanKhas ?? "");

  if (!parent) return <p>Warga emas tidak dijumpai.</p>;

  // All records for this elderly — newest first (the live history feed).
  const history = trackers
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const totalChecked = checklist.filter((c) => c.done).length;

  const toggleCheck = (id: string) => {
    const next = checklist.map((c) =>
      c.id === id ? { ...c, done: !c.done } : c,
    );
    setLocalChecklist(next);
    setChecklist(parentId, staffId, next);
  };

  const saveCatatan = () => {
    setCatatanKhas(parentId, staffId, catatan);
    toast.success("Catatan khas disimpan");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">Rekod Harian</h1>
          <p className="text-sm text-muted-foreground">
            Untuk:{" "}
            <span className="font-medium text-foreground">
              {parent.fullName}
            </span>{" "}
            · Direkod oleh:{" "}
            <span className="font-medium text-foreground">{user?.name}</span>
          </p>
        </div>
        <ElderlyInfoDialog parent={parent} />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-teal/30 bg-teal/10 p-3 text-xs text-foreground">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
        <p>
          Tekan butang untuk rekod setiap perkara{" "}
          <span className="font-medium">satu per satu secara langsung</span>.
          Setiap rekod disimpan terus menggunakan masa semasa secara automatik.
        </p>
      </div>

      {/* ===== Tab Bar: Rekod / Checklist ===== */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-muted/40 p-1.5">
        <button
          type="button"
          onClick={() => setTab("rekod")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "rekod"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Rekod
        </button>
        <button
          type="button"
          onClick={() => setTab("checklist")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "checklist"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Checklist{" "}
          <span className="text-xs font-normal">
            ({totalChecked}/{checklist.length})
          </span>
        </button>
      </div>

      {/* ===== REKOD TAB ===== */}
      <div className={tab === "rekod" ? "space-y-5" : "hidden"}>
        {/* ===== 4 main action buttons (navigate to each add-report form) ===== */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.to}
                to={a.to}
                params={{ parentId }}
                className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card p-4 text-center transition-colors hover:border-teal/50 hover:bg-teal/5"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl gradient-sage text-sage-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-tight">
                  {a.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* ===== History of records already entered ===== */}
        <div>
          <h2 className="mb-2 font-display text-lg font-bold">Sejarah Rekod</h2>
          {history.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
              Belum ada rekod. Tekan butang di atas untuk mula merekod.
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((t) => (
                <Link
                  key={t.id}
                  to="/staf/tracker/$parentId/sejarah/$recordId"
                  params={{ parentId, recordId: t.id }}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-teal/50 hover:bg-teal/5"
                >
                  <div>
                    <p className="font-display font-semibold">
                      {format(new Date(t.date), "dd MMM yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Kemaskini terakhir:{" "}
                      {format(new Date(t.editedAt ?? t.date), "HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== CHECKLIST TAB ===== */}
      <div className={tab === "checklist" ? "space-y-5" : "hidden"}>
        <Card className="border-border/60 p-5">
          <div className="mb-4">
            <p className="font-display font-semibold">Senarai Semak</p>
            <p className="text-xs text-muted-foreground">
              {totalChecked}/{checklist.length} tugasan selesai
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {checklist.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
              >
                <Checkbox
                  checked={c.done}
                  onCheckedChange={() => toggleCheck(c.id)}
                />
                <span
                  className={`text-sm ${c.done ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* ===== Catatan Khas / Special Remark ===== */}
        <Card className="border-border/60 p-5">
          <Label className="text-xs">Catatan Khas / Special Remark</Label>
          <Textarea
            rows={3}
            className="mt-1.5"
            value={catatan}
            onChange={(e) => setLocalCatatan(e.target.value)}
            placeholder="Sebarang perkara penting yang perlu diberi perhatian..."
          />
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" onClick={saveCatatan}>
              Simpan Catatan
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
