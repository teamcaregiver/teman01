import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { parents, trackers, users } from "@/lib/mock-data";
import { RecordReport } from "@/components/record-report";
import { VitalCharts } from "@/components/vital-charts";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { ChevronLeft, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/admin/rekod-harian/$recordId")({
  component: RekodHarianDetail,
});

function RekodHarianDetail() {
  const { recordId } = useParams({ from: "/admin/rekod-harian/$recordId" });
  const record = trackers.find((t) => t.id === recordId);
  const parent = record
    ? parents.find((p) => p.id === record.parentId)
    : undefined;
  const staff = record ? users.find((u) => u.id === record.staffId) : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        to="/admin/tracker"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Rekod Harian
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold">
          Butiran Rekod Penjagaan
        </h1>
        <p className="text-sm text-muted-foreground">
          Rekod penjagaan harian yang direkodkan oleh caregiver (paparan
          sahaja).
        </p>
      </div>

      {!record || !parent ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Rekod tidak dijumpai.
        </Card>
      ) : (
        <>
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="text-sm font-semibold text-foreground">
              {parent.fullName}
            </span>
            <span>·</span>
            <span>{format(new Date(record.date), "dd MMM yyyy, HH:mm")}</span>
            <span>·</span>
            <span>
              Staf:{" "}
              <span className="font-medium text-foreground">
                {staff?.name ?? "—"}
              </span>
            </span>
            <StatusBadge status={record.status} />
          </div>

          {/* Vital chart summary */}
          {(record.vitalEntries?.length ?? 0) > 0 && (
            <section className="space-y-2">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <span className="text-primary">
                  <HeartPulse className="h-4 w-4" />
                </span>
                Graf Ringkasan Tanda Vital
              </h2>
              <VitalCharts records={[record]} />
            </section>
          )}

          {/* Vital / Ubatan / Makanan / Aktiviti — table view (same as anak side) */}
          <Card className="border-border/60 p-5">
            <RecordReport record={record} />
          </Card>
        </>
      )}
    </div>
  );
}
