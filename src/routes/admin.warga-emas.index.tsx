import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useArchivedParentsQuery, useParentsQuery, useUsers } from "@/lib/data";
import { useState } from "react";
import { Archive, Heart, Plus, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { StaggerItem, StaggerList } from "@/components/page-transition";

export const Route = createFileRoute("/admin/warga-emas/")({
  component: WargaPage,
});

type Tab = "active" | "archived";

function WargaPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");

  const activeQ = useParentsQuery();
  const archivedQ = useArchivedParentsQuery();
  const users = useUsers();

  const source = tab === "active" ? activeQ : archivedQ;
  const parents = source.data ?? [];
  const needle = q.trim().toLowerCase();
  const list = parents.filter(
    (p) =>
      p.fullName.toLowerCase().includes(needle) || p.ic.toLowerCase().includes(needle),
  );

  const counts = {
    active: activeQ.data?.length ?? 0,
    archived: archivedQ.data?.length ?? 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Warga Emas</h1>
          <p className="text-sm text-muted-foreground">Senarai semua warga emas berdaftar.</p>
        </div>
        <Button asChild>
          <Link to="/admin/warga-emas/baru">
            <UserPlus className="mr-1 h-4 w-4" /> Daftar Warga Emas
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Tapis senarai warga emas"
          className="flex flex-wrap gap-1.5"
        >
          <TabButton active={tab === "active"} onClick={() => setTab("active")}>
            Aktif <span className="ml-1 opacity-70">({counts.active})</span>
          </TabButton>
          <TabButton active={tab === "archived"} onClick={() => setTab("archived")}>
            Arkib <span className="ml-1 opacity-70">({counts.archived})</span>
          </TabButton>
        </div>

        <div className="relative w-full max-w-sm sm:w-auto sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama atau No. IC..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {source.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : source.isError ? (
        <Card className="border-border/60 p-10 text-center">
          <p className="text-sm font-medium">Gagal memuatkan senarai</p>
          <p className="mt-1 text-xs text-muted-foreground">{(source.error as Error).message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void source.refetch()}>
            Cuba lagi
          </Button>
        </Card>
      ) : list.length === 0 ? (
        <EmptyState tab={tab} searching={needle.length > 0} />
      ) : (
        <StaggerList>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => {
              const staff = users.find((u) => u.id === p.staffId);
              return (
                <StaggerItem key={p.id}>
                  <Link to="/admin/warga-emas/$parentId" params={{ parentId: p.id }}>
                    <Card className="hover-lift h-full border-border/60 p-5">
                      <div className="flex items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-peach font-display font-bold text-peach-foreground">
                          {p.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display font-semibold">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.ic} · {p.gender === "L" ? "Lelaki" : "Perempuan"}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <p><span className="font-medium text-foreground">Kondisi:</span> {p.medicalCondition || "—"}</p>
                        <p><span className="font-medium text-foreground">Penjaga:</span> {staff?.name ?? "Belum ditetapkan"}</p>
                        <p><span className="font-medium text-foreground">Anak terpaut:</span> {p.anakIds.length}</p>
                        {p.archivedAt && (
                          <p>
                            <span className="font-medium text-foreground">Diarkibkan:</span>{" "}
                            {format(new Date(p.archivedAt), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {p.relationship && (
                          <Badge variant="secondary" className="bg-sage/20 text-sage-foreground">{p.relationship}</Badge>
                        )}
                        {p.archivedAt && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">Diarkibkan</Badge>
                        )}
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ tab, searching }: { tab: Tab; searching: boolean }) {
  const archived = tab === "archived";
  return (
    <Card className="border-border/60 p-10 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full gradient-sage text-sage-foreground">
        {archived ? <Archive className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
      </div>
      <p className="mt-3 text-sm font-medium">
        {searching
          ? "Tiada warga emas sepadan"
          : archived
            ? "Tiada warga emas diarkibkan"
            : "Belum ada warga emas berdaftar"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {searching
          ? "Cuba kata kunci lain, atau semak tab yang satu lagi."
          : archived
            ? "Warga emas yang diarkibkan akan dipaparkan di sini, lengkap dengan sejarah rekod mereka."
            : "Daftarkan warga emas pertama untuk mula merekod penjagaan harian."}
      </p>
      {!searching && !archived && (
        <Button size="sm" className="mt-4" asChild>
          <Link to="/admin/warga-emas/baru">
            <Plus className="mr-1 h-4 w-4" /> Daftar Warga Emas
          </Link>
        </Button>
      )}
    </Card>
  );
}
