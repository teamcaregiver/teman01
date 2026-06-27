import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parents, trackers } from "@/lib/mock-data";
import type { TrackerRecord } from "@/lib/mock-data";
import { VitalCharts } from "@/components/vital-charts";
import { RecordReport } from "@/components/record-report";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { ChevronLeft, ImageIcon, RefreshCw, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/anak/perkembangan/$parentId")({
  component: Perkembangan,
});

function Perkembangan() {
  const { parentId } = useParams({ from: "/anak/perkembangan/$parentId" });
  const parent = parents.find((p) => p.id === parentId);

  // Lightweight polling so new staff entries appear without manual refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  // User-picked date range (from … until). Undefined = default to latest day.
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const rows = trackers
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  // Days that actually have records — used to disable empty days in the calendar.
  const recordDays = useMemo(
    () => new Set(rows.map((r) => format(new Date(r.date), "yyyy-MM-dd"))),
    [rows],
  );

  if (!parent) return <p>Warga emas tidak dijumpai.</p>;

  // Effective range: fall back to the most recent recorded day when unset.
  const latestDay = rows[0] ? startOfDay(new Date(rows[0].date)) : undefined;
  const fromDate = range?.from ?? latestDay;
  const toDate = range?.to ?? fromDate;

  const inRange = (r: TrackerRecord) => {
    if (!fromDate) return true;
    const d = new Date(r.date);
    return d >= startOfDay(fromDate) && d <= endOfDay(toDate ?? fromDate);
  };

  const dayRows = rows.filter(inRange);
  const dayPhotos = dayRows.flatMap((r) => r.gambar ?? []);
  const hasVitals = dayRows.some(
    (r) => r.vitalEntries && r.vitalEntries.length > 0,
  );

  const rangeLabel = !fromDate
    ? "Pilih tarikh"
    : !toDate || isSameDay(fromDate, toDate)
      ? format(fromDate, "EEEE, dd MMM yyyy")
      : `${format(fromDate, "dd MMM yyyy")} – ${format(toDate, "dd MMM yyyy")}`;

  return (
    <div className="space-y-5">
      <Link
        to="/anak"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">{parent.fullName}</h1>
          <p className="text-xs text-muted-foreground">
            {parent.relationship} · {parent.medicalCondition}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-normal/10 px-2.5 py-1 text-[11px] font-medium text-status-normal">
          <RefreshCw className="h-3 w-3" /> Kemaskini langsung
        </span>
      </div>

      {rows.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada rekod penjagaan. Data akan muncul di sini sebaik staf
          merekod.
        </Card>
      ) : (
        <>
          {/* Date filter — pick a single day or a range (dari … hingga) from the calendar */}
          <Card className="border-border/60 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted/60">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Tapis mengikut tarikh
                </p>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">{rangeLabel}</span>
                      <CalendarDays className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={
                        fromDate ? { from: fromDate, to: toDate } : undefined
                      }
                      defaultMonth={fromDate}
                      onSelect={setRange}
                      disabled={(date) =>
                        !recordDays.has(format(date, "yyyy-MM-dd"))
                      }
                      numberOfMonths={1}
                    />
                    <div className="flex items-center justify-between gap-2 border-t border-border p-2">
                      <p className="px-1 text-[11px] text-muted-foreground">
                        Pilih tarikh mula & tamat
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setRange(undefined);
                          setCalendarOpen(false);
                        }}
                      >
                        Set semula
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>

          {/* Records for the selected date */}
          {dayRows.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
              Tiada rekod untuk tarikh ini.
            </Card>
          ) : (
            dayRows.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-border/60 p-4 space-y-4">
                  <div>
                    <p className="font-display font-semibold">
                      Rekod Penjagaan
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <RecordReport record={r} />
                </Card>
              </motion.div>
            ))
          )}

          {/* Per-vital-sign graphs for the selected date/range (x-axis = time) */}
          {hasVitals && (
            <div>
              <h2 className="font-display text-lg font-bold">
                Graf Tanda Vital
              </h2>
              <p className="mb-2 text-xs text-muted-foreground">
                Bacaan untuk {rangeLabel} mengikut waktu.
              </p>
              <VitalCharts records={dayRows} />
            </div>
          )}

          {/* Photo gallery for the selected date */}
          {dayPhotos.length > 0 && (
            <div>
              <h2 className="mb-2 flex items-center gap-1.5 font-display text-lg font-bold">
                <ImageIcon className="h-4 w-4" /> Galeri Aktiviti
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {dayPhotos.map((g, i) => (
                  <img
                    key={i}
                    src={g}
                    alt={`Aktiviti ${i + 1}`}
                    className="aspect-square rounded-xl object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
