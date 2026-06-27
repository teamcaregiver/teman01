import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { trackers } from "@/lib/mock-data";
import { RecordReport } from "@/components/record-report";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute(
  "/staf/tracker/$parentId/sejarah/$recordId",
)({
  component: RekodDetailPage,
});

function RekodDetailPage() {
  const { parentId, recordId } = useParams({
    from: "/staf/tracker/$parentId/sejarah/$recordId",
  });
  const record = trackers.find((t) => t.id === recordId);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        to="/staf/tracker/$parentId"
        params={{ parentId }}
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Rekod Harian
      </Link>

      {!record ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Rekod tidak dijumpai.
        </Card>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold">
                Rekod Penjagaan
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(record.date), "EEEE, dd MMM yyyy")}
              </p>
            </div>
            <StatusBadge status={record.status} />
          </div>
          <Card className="border-border/60 p-5">
            <RecordReport record={record} showPengesahan={false} />
          </Card>
        </>
      )}
    </div>
  );
}
