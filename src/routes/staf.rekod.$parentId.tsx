import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parents, trackers } from "@/lib/mock-data";
import type { Parent, TrackerRecord } from "@/lib/mock-data";
import { entryTime } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { StatusBadge } from "@/components/status-badge";
import { ElderlyInfoDialog } from "@/components/elderly-info-dialog";
import { VitalCharts } from "@/components/vital-charts";
import { careCats } from "@/lib/care-cats";
import { format, isSameDay, startOfDay } from "date-fns";
import { Check, ChevronLeft, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/staf/rekod/$parentId")({
  component: RekodSayaDetail,
});

function RekodSayaDetail() {
  const { parentId } = useParams({ from: "/staf/rekod/$parentId" });
  const { user } = useAuth();
  const parent = parents.find((p) => p.id === parentId);

  // Records this staff recorded for this elderly, newest first.
  const rows = trackers
    .filter((t) => t.parentId === parentId && t.staffId === user?.id)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  // Days that actually have records — used to disable empty days in the calendar.
  const recordDays = new Set(
    rows.map((r) => format(new Date(r.date), "yyyy-MM-dd")),
  );

  const latestDay = rows[0] ? startOfDay(new Date(rows[0].date)) : new Date();
  const [date, setDate] = useState<Date>(latestDay);
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (!parent) return <p>Warga emas tidak dijumpai.</p>;

  const record = rows.find((r) => isSameDay(new Date(r.date), date));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/staf/rekod"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Rekod Saya
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">{parent.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {parent.medicalCondition}
          </p>
        </div>
        <ElderlyInfoDialog parent={parent} />
      </div>

      {/* Date picker — choose a specific day to view the record */}
      <Card className="border-border/60 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted/60">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Pilih tarikh rekod
            </p>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {format(date, "EEEE, dd MMM yyyy")}
                  </span>
                  <CalendarDays className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  defaultMonth={date}
                  onSelect={(d) => {
                    if (d) setDate(startOfDay(d));
                    setCalendarOpen(false);
                  }}
                  disabled={(d) => !recordDays.has(format(d, "yyyy-MM-dd"))}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      <ResidentDetail parent={parent} record={record} />
    </div>
  );
}

function ResidentDetail({
  parent,
  record,
}: {
  parent: Parent;
  record?: TrackerRecord;
}) {
  const cats = careCats(record);
  const doneCount = cats.filter((c) => c.done).length;
  const pct = (doneCount / cats.length) * 100;

  const checklist = record?.checklist ?? [];
  const checkedCount = checklist.filter((c) => c.done).length;
  const vitals = record?.vitalEntries ?? [];

  if (!record) {
    return (
      <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
        Tiada rekod untuk tarikh ini.
      </Card>
    );
  }

  return (
    <Card className="border-border/60 space-y-4 p-5">
      {/* Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Status</span>
        <StatusBadge status={record.status} />
      </div>

      {/* Overall progress */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium">Rekod hari ini</span>
          <span className="text-muted-foreground">
            {doneCount}/{cats.length} selesai
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Completion checklist + latest entry per category */}
      <div className="space-y-2">
        {cats.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.key}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                c.done
                  ? "border-status-normal/30 bg-status-normal/5"
                  : "border-border bg-muted/20"
              }`}
            >
              <span
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  c.done
                    ? "bg-status-normal text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {c.done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{c.label}</p>
                  {c.done && c.masa && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {entryTime(c.masa)}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {c.done ? c.detail || "Direkod" : "Belum direkod"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily care checklist progress (Senarai Semak) */}
      {checklist.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium">Senarai Semak</span>
            <span className="text-muted-foreground">
              {checkedCount}/{checklist.length} selesai
            </span>
          </div>
          <Progress
            value={(checkedCount / checklist.length) * 100}
            className="h-2"
          />
        </div>
      )}

      {/* Catatan Khas */}
      {record.catatanKhas && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Catatan Khas
          </p>
          <p className="whitespace-pre-wrap text-sm">{record.catatanKhas}</p>
        </div>
      )}

      {/* Vital chart (same as family site) */}
      {vitals.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Graf Tanda Vital
          </p>
          <VitalCharts records={[record]} />
        </div>
      )}

      <div className="flex justify-end">
        <Button asChild size="sm" variant="outline">
          <Link to="/staf/tracker/$parentId" params={{ parentId: parent.id }}>
            Buka Rekod Harian{" "}
            <ChevronLeft className="ml-1 h-3.5 w-3.5 rotate-180" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
