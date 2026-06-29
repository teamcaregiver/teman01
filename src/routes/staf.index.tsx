import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParents, useTrackers } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { Heart, Activity, ClipboardPlus } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/staf/")({
  component: StaffHome,
});

function StaffHome() {
  const { user } = useAuth();
  const parents = useParents();
  const trackers = useTrackers();
  const assigned = parents.filter((p) => p.staffId === user?.id);
  const myRecords = trackers.filter((t) => t.staffId === user?.id);
  const today = new Date().toDateString();
  const todayCount = myRecords.filter(
    (t) => new Date(t.date).toDateString() === today,
  ).length;
  const attention = myRecords.filter((t) => t.status !== "normal").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Hai, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan tugasan penjagaan anda.
        </p>
      </div>

      <StaggerList>
        <div className="grid gap-4 sm:grid-cols-3">
          <StaggerItem>
            <StatCard
              tone="teal"
              label="Warga Emas"
              value={assigned.length}
              icon={<Heart className="h-4 w-4" />}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              tone="sage"
              label="Rekod Hari Ini"
              value={todayCount}
              icon={<ClipboardPlus className="h-4 w-4" />}
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              tone="peach"
              label="Perlu Perhatian"
              value={attention}
              icon={<Activity className="h-4 w-4" />}
            />
          </StaggerItem>
        </div>
      </StaggerList>

      <Card className="border-border/60 p-5">
        <h2 className="mb-4 font-display text-lg font-bold">Warga Emas Saya</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {assigned.map((p) => {
            const last = myRecords
              .filter((t) => t.parentId === p.id)
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
            return (
              <Card key={p.id} className="hover-lift border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">
                      {p.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.medicalCondition}
                    </p>
                    {last && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Rekod terakhir:{" "}
                        {format(new Date(last.date), "dd MMM, HH:mm")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button asChild size="sm">
                    <Link
                      to="/staf/tracker/$parentId"
                      params={{ parentId: p.id }}
                    >
                      Rekod Baru
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
