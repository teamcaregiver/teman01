import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GenderAvatar } from "@/components/gender-avatar";
import { LokasiFilter } from "@/components/lokasi-select";
import {
  useArchivedParentsQuery,
  useBookings,
  useGetServiceType,
  useParentsQuery,
  useUsers,
} from "@/lib/data";
import { SEMUA_LOKASI, matchesLokasi } from "@/lib/lokasi";
import { ringkasanPenerima } from "@/lib/penerima-servis";
import { useState } from "react";
import { Archive, Heart, MapPin, Plus, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { StaggerItem, StaggerList } from "@/components/page-transition";

export const Route = createFileRoute("/admin/warga-emas/")({
  component: WargaPage,
});

type Tab = "active" | "archived";

function WargaPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");
  const [lokasi, setLokasi] = useState(SEMUA_LOKASI);

  const activeQ = useParentsQuery();
  const archivedQ = useArchivedParentsQuery();
  const users = useUsers();
  const bookings = useBookings();
  const getServiceType = useGetServiceType();
  const nameOf = (id?: string) =>
    id ? users.find((u) => u.id === id)?.name : undefined;

  const source = tab === "active" ? activeQ : archivedQ;
  const parents = source.data ?? [];
  const needle = q.trim().toLowerCase();
  const list = parents.filter(
    (p) =>
      (p.fullName.toLowerCase().includes(needle) ||
        p.ic.toLowerCase().includes(needle)) &&
      matchesLokasi(p.lokasi, lokasi),
  );

  const counts = {
    active: activeQ.data?.length ?? 0,
    archived: archivedQ.data?.length ?? 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Penerima Servis</h1>
          <p className="text-sm text-muted-foreground">
            Senarai semua penerima servis berdaftar.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/warga-emas/baru">
            <UserPlus className="mr-1 h-4 w-4" /> Daftar Penerima Servis
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Tapis senarai penerima servis"
          className="flex flex-wrap gap-1.5"
        >
          <TabButton active={tab === "active"} onClick={() => setTab("active")}>
            Aktif <span className="ml-1 opacity-70">({counts.active})</span>
          </TabButton>
          <TabButton
            active={tab === "archived"}
            onClick={() => setTab("archived")}
          >
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

        <LokasiFilter
          value={lokasi}
          onChange={setLokasi}
          values={parents.map((p) => p.lokasi)}
        />
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
          <p className="mt-1 text-xs text-muted-foreground">
            {(source.error as Error).message}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void source.refetch()}
          >
            Cuba lagi
          </Button>
        </Card>
      ) : list.length === 0 ? (
        <EmptyState
          tab={tab}
          searching={needle.length > 0 || lokasi !== SEMUA_LOKASI}
        />
      ) : (
        <StaggerList>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => {
              const r = ringkasanPenerima(p, bookings);
              const diluluskan = r.bookingDiluluskan
                ? `${format(new Date(r.bookingDiluluskan.tarikh), "dd MMM yyyy")} · ${
                    getServiceType(r.bookingDiluluskan.serviceTypeId)?.name ??
                    "Servis"
                  }`
                : undefined;
              return (
                <StaggerItem key={p.id}>
                  <Link
                    to="/admin/warga-emas/$parentId"
                    params={{ parentId: p.id }}
                  >
                    <Card className="hover-lift h-full border-border/60 p-5">
                      <div className="flex items-start gap-3">
                        <GenderAvatar gender={p.gender} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display font-semibold">
                            {p.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.ic || "—"} ·{" "}
                            {p.gender === "L" ? "Lelaki" : "Perempuan"}
                          </p>
                          {p.lokasi && (
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {p.lokasi}
                            </p>
                          )}
                        </div>
                      </div>
                      <dl className="mt-4 space-y-2 text-xs text-muted-foreground">
                        <Row label="No. Telefon" value={p.phone} />
                        <Row label="Booking Diluluskan" value={diluluskan} />
                        <Row
                          label="Temanion Terakhir"
                          value={nameOf(r.temanionTerakhirId)}
                        />
                        <Row
                          label="Penempah Servis"
                          value={nameOf(r.penempahId)}
                        />
                        {p.archivedAt && (
                          <Row
                            label="Diarkibkan"
                            value={format(
                              new Date(p.archivedAt),
                              "dd MMM yyyy",
                            )}
                          />
                        )}
                      </dl>
                      {p.archivedAt && (
                        <div className="mt-4">
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground"
                          >
                            Diarkibkan
                          </Badge>
                        </div>
                      )}
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

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 font-medium text-foreground">{label}:</dt>
      <dd className="min-w-0 break-words">{value?.trim() ? value : "—"}</dd>
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
        {archived ? (
          <Archive className="h-5 w-5" />
        ) : (
          <Heart className="h-5 w-5" />
        )}
      </div>
      <p className="mt-3 text-sm font-medium">
        {searching
          ? "Tiada penerima servis sepadan"
          : archived
            ? "Tiada penerima servis diarkibkan"
            : "Belum ada penerima servis berdaftar"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {searching
          ? "Cuba kata kunci atau lokasi lain, atau semak tab yang satu lagi."
          : archived
            ? "Penerima servis yang diarkibkan akan dipaparkan di sini, lengkap dengan sejarah rekod mereka."
            : "Daftarkan penerima servis pertama untuk mula merekod penjagaan harian."}
      </p>
      {!searching && !archived && (
        <Button size="sm" className="mt-4" asChild>
          <Link to="/admin/warga-emas/baru">
            <Plus className="mr-1 h-4 w-4" /> Daftar Penerima Servis
          </Link>
        </Button>
      )}
    </Card>
  );
}
