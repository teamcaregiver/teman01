import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { articles, parents, trackers, users, videos } from "@/lib/mock-data";
import { Activity, BookOpen, Heart, Users } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const recent = [...trackers].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Selamat datang, Admin</h1>
        <p className="text-sm text-muted-foreground">Ringkasan sistem penjagaan hari ini.</p>
      </div>
      <StaggerList>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem><StatCard tone="teal" label="Warga Emas" value={parents.length} icon={<Heart className="h-4 w-4" />} /></StaggerItem>
          <StaggerItem><StatCard tone="sage" label="Staf Aktif" value={users.filter(u => u.role === "staff" && u.status === "active").length} icon={<Users className="h-4 w-4" />} /></StaggerItem>
          <StaggerItem><StatCard tone="peach" label="Rekod Harian" value={trackers.length} icon={<Activity className="h-4 w-4" />} /></StaggerItem>
          <StaggerItem><StatCard tone="lavender" label="Kandungan" value={articles.length + videos.length} icon={<BookOpen className="h-4 w-4" />} /></StaggerItem>
        </div>
      </StaggerList>

      <Card className="border-border/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Rekod terkini</h2>
          <span className="text-xs text-muted-foreground">{recent.length} rekod</span>
        </div>
        <div className="divide-y divide-border">
          {recent.map((t) => {
            const p = parents.find((x) => x.id === t.parentId);
            return (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(t.date), "dd MMM, HH:mm")} · TD {t.bpSystolic}/{t.bpDiastolic} · Gula {t.bloodSugar}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
