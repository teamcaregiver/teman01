import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { parents, trackers } from "@/lib/mock-data";
import { careCats } from "@/lib/care-cats";
import { useAuth } from "@/lib/auth-store";
import { StatusBadge } from "@/components/status-badge";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { isSameDay } from "date-fns";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/staf/rekod/")({
  component: MyRecords,
});

function MyRecords() {
  const { user } = useAuth();
  const assigned = parents.filter((p) => p.staffId === user?.id);
  const now = new Date();

  const recordFor = (pid: string) =>
    trackers
      .filter(
        (t) =>
          t.parentId === pid &&
          t.staffId === user?.id &&
          isSameDay(new Date(t.date), now),
      )
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Rekod Saya</h1>
        <p className="text-sm text-muted-foreground">
          Kemajuan penjagaan harian setiap warga emas anda. Tekan untuk lihat
          butiran.
        </p>
      </div>

      {assigned.length === 0 ? (
        <Card className="border-dashed p-10 text-center text-sm text-muted-foreground">
          Tiada warga emas ditugaskan kepada anda.
        </Card>
      ) : (
        <StaggerList>
          <div className="space-y-3">
            {assigned.map((p) => {
              const record = recordFor(p.id);
              const cats = careCats(record);
              const doneCount = cats.filter((c) => c.done).length;
              const pct = (doneCount / cats.length) * 100;
              return (
                <StaggerItem key={p.id}>
                  <Link
                    to="/staf/rekod/$parentId"
                    params={{ parentId: p.id }}
                    className="block"
                  >
                    <Card className="hover-lift border-border/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-display font-semibold">
                              {p.fullName}
                            </p>
                            {record ? (
                              <StatusBadge status={record.status} />
                            ) : (
                              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                Belum direkod
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.medicalCondition}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                              {doneCount}/{cats.length} rekod
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                </StaggerItem>
              );
            })}
          </div>
        </StaggerList>
      )}
    </div>
  );
}
