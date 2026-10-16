import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyServicesQuery, useParents, useTrackers } from "@/lib/data";
import type { MyService } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import {
  Heart,
  Activity,
  ClipboardPlus,
  HeartHandshake,
  MapPin,
  CalendarDays,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/staf/")({
  component: StaffHome,
});

/** "13 Okt 2026 · 10:00", or a placeholder when the date is not set yet. */
function serviceDate(s: MyService): string {
  if (!s.date) return "Belum ditetapkan";
  const day = format(parseISO(s.date), "dd MMM yyyy");
  return s.time ? `${day} · ${s.time}` : day;
}

function StaffHome() {
  const { user } = useAuth();
  const parents = useParents();
  const trackers = useTrackers();
  const servicesQ = useMyServicesQuery();
  const assigned = parents.filter((p) => p.staffId === user?.id);
  const assignedIds = new Set(assigned.map((p) => p.id));
  const myRecords = trackers.filter((t) => t.staffId === user?.id);
  const today = new Date().toDateString();
  const todayCount = myRecords.filter(
    (t) => new Date(t.date).toDateString() === today,
  ).length;
  const attention = myRecords.filter((t) => t.status !== "normal").length;
  // Completed services are already left out by list_my_services().
  const services = servicesQ.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Hai, {user?.name}
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
              label="Penerima Servis"
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
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold">Servis Saya</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Servis yang ditugaskan kepada anda.
          </p>
        </div>

        {servicesQ.isPending ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : servicesQ.isError ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-status-critical/5 px-4 py-10 text-center">
            <p className="text-sm font-medium">Gagal memuatkan servis</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {(servicesQ.error as Error).message}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void servicesQ.refetch()}
            >
              <RefreshCw className="mr-1 h-4 w-4" /> Cuba lagi
            </Button>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 px-4 py-10 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-full gradient-sage text-sage-foreground">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium">Tiada servis buat masa ini</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Servis baru akan dipaparkan di sini sebaik sahaja admin
              menugaskannya kepada anda.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((s) => (
              <Card key={s.id} className="hover-lift border-border/60 p-4">
                <p className="truncate font-display font-semibold">
                  {s.clientName ??
                    (s.bookedBy ? `Tempahan oleh ${s.bookedBy}` : "Tanpa nama")}
                </p>
                <dl className="mt-2 space-y-1.5 text-xs">
                  <ServiceField
                    icon={<HeartHandshake className="h-3.5 w-3.5" />}
                    label="Servis"
                    value={s.serviceName}
                  />
                  <ServiceField
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label="Lokasi"
                    value={s.location || "—"}
                  />
                  <ServiceField
                    icon={<CalendarDays className="h-3.5 w-3.5" />}
                    label="Tarikh servis"
                    value={serviceDate(s)}
                  />
                </dl>
                {s.parentId && assignedIds.has(s.parentId) && (
                  <div className="mt-3 flex justify-end">
                    <Button asChild size="sm">
                      <Link
                        to="/staf/tracker/$parentId"
                        params={{ parentId: s.parentId }}
                      >
                        Rekod Baru
                      </Link>
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ServiceField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <dt className="flex w-28 shrink-0 items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 font-medium text-foreground">{value}</dd>
    </div>
  );
}
