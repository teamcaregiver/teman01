import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  bookings,
  parents,
  trackers,
  getCaregiver,
  entryTime,
} from "@/lib/mock-data";
import type { TrackerRecord } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { VitalCharts } from "@/components/vital-charts";
import { format } from "date-fns";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  HeartPulse,
  Pill,
  UtensilsCrossed,
} from "lucide-react";

export const Route = createFileRoute("/admin/rekod-penjagaan/$bookingId")({
  component: RekodPenjagaan,
});

const WAKTU_VITAL_LABEL: Record<string, string> = {
  pagi: "Pagi",
  tengahari: "Tengah Hari",
  petang: "Petang",
  malam: "Malam",
};
const WAKTU_UBATAN_LABEL: Record<string, string> = {
  pagi: "Pagi",
  tengahari: "Tengah Hari",
  petang: "Petang",
  malam: "Malam",
  prn: "PRN (Bila Perlu)",
  kecemasan: "Kecemasan",
};
const WAKTU_MAKANAN_LABEL: Record<string, string> = {
  pagi: "Sarapan Pagi",
  snekPagi: "Snek Pagi / Brunch",
  tengahari: "Makan Tengah Hari",
  minumPetang: "Minum Petang",
  makanMalam: "Makan Malam",
  snekMalam: "Snek Malam",
};
const KUANTITI_LABEL: Record<string, string> = {
  tidakMakan: "Tidak Makan",
  suku: "Suku",
  separuh: "Separuh",
  tigaSuku: "3 Suku",
  penuh: "Penuh",
};

const waktuLabel = (
  map: Record<string, string>,
  waktu?: string,
  masa?: string,
) => (waktu ? (map[waktu] ?? waktu) : entryTime(masa));

function RekodPenjagaan() {
  const { bookingId } = useParams({
    from: "/admin/rekod-penjagaan/$bookingId",
  });
  const booking = bookings.find((b) => b.id === bookingId);
  const parent = booking?.parentId
    ? parents.find((p) => p.id === booking.parentId)
    : undefined;
  const cg = getCaregiver(booking?.caregiverId);

  // All daily-care records for this booking's elderly, newest day first.
  const allRecords: TrackerRecord[] = useMemo(
    () =>
      parent
        ? trackers
            .filter((t) => t.parentId === parent.id)
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        : [],
    [parent],
  );

  // Distinct days that actually have records (ascending), used for the date
  // range bounds and the quick-jump chips.
  const availableDates = useMemo(
    () =>
      Array.from(new Set(allRecords.map((r) => r.date.slice(0, 10)))).sort(),
    [allRecords],
  );
  const minDate = availableDates[0];
  const maxDate = availableDates[availableDates.length - 1];

  // Date-range filter (empty = no bound on that side).
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const records = useMemo(
    () =>
      allRecords
        .filter((t) => !from || t.date.slice(0, 10) >= from)
        .filter((t) => !to || t.date.slice(0, 10) <= to),
    [allRecords, from, to],
  );

  if (!booking || !parent) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/servis"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali ke Servis Monitoring
        </Link>
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Tempahan atau warga emas tidak dijumpai.
        </Card>
      </div>
    );
  }

  // Flatten records into per-row tables for easy scanning.
  const vitalRows = records.flatMap((r) =>
    (r.vitalEntries ?? []).map((v) => ({ r, v })),
  );
  const ubatRows = records.flatMap((r) =>
    (r.ubatanEntries ?? [])
      .filter((u) => u.items.length > 0)
      .flatMap((u) => u.items.map((item) => ({ r, u, item }))),
  );
  const makanRows = records.flatMap((r) =>
    (r.makananEntries ?? [])
      .filter((m) => m.jenisMakanan || m.jenisMinum)
      .map((m) => ({ r, m })),
  );
  const aktivitiRows = records.filter((r) => r.aktiviti);

  return (
    <div className="space-y-5">
      <Link
        to="/admin/servis"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Servis Monitoring
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold">
          Rekod Harian Penjagaan
        </h1>
        <p className="text-sm text-muted-foreground">
          Butiran rekod penjagaan harian yang direkodkan oleh caregiver untuk
          tempahan ini (paparan sahaja).
        </p>
      </div>

      {/* Context: elderly + caregiver + booking */}
      <Card className="border-border/60 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Warga Emas
            </p>
            <p className="mt-0.5 text-sm font-semibold">{parent.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {parent.medicalCondition}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Caregiver Ditugaskan
            </p>
            {cg ? (
              <div className="mt-1 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={cg.avatar} alt={cg.name} />
                  <AvatarFallback className="text-[10px]">
                    {initials(cg.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{cg.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cg.specialization}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-0.5 text-sm text-status-attention">
                Belum ditetapkan
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Tarikh & Masa Servis
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {format(
                new Date(`${booking.date}T${booking.time}`),
                "dd MMM yyyy · HH:mm",
              )}
            </p>
          </div>
        </div>
      </Card>

      {allRecords.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Belum ada rekod penjagaan harian direkodkan untuk warga emas ini.
        </Card>
      ) : (
        <>
          {/* Date range filter */}
          <Card className="border-border/60 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Dari Tarikh</Label>
                <Input
                  type="date"
                  value={from}
                  min={minDate}
                  max={to || maxDate}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-[170px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hingga Tarikh</Label>
                <Input
                  type="date"
                  value={to}
                  min={from || minDate}
                  max={maxDate}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-[170px]"
                />
              </div>
              {(from || to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFrom("");
                    setTo("");
                  }}
                >
                  Set Semula
                </Button>
              )}
            </div>

            {/* Quick-jump chips — only days that actually have data */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Tarikh ada data:
              </span>
              {availableDates.map((d) => {
                const active = from === d && to === d;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      setFrom(d);
                      setTo(d);
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {format(new Date(d), "dd MMM yyyy")}
                  </button>
                );
              })}
            </div>
          </Card>

          {records.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
              Tiada rekod untuk julat tarikh yang dipilih.
            </Card>
          ) : (
            <>
              {/* Vital chart summary */}
              {vitalRows.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle icon={<HeartPulse className="h-4 w-4" />}>
                    Graf Ringkasan Tanda Vital
                  </SectionTitle>
                  <VitalCharts records={records} />
                </section>
              )}

              {/* Tanda Vital table */}
              {vitalRows.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle icon={<HeartPulse className="h-4 w-4" />}>
                    Tanda Vital
                  </SectionTitle>
                  <Card className="overflow-x-auto border-border/60 p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Tarikh</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Suhu</TableHead>
                          <TableHead>Tekanan Darah</TableHead>
                          <TableHead>Nadi</TableHead>
                          <TableHead>Pernafasan</TableHead>
                          <TableHead>Gula</TableHead>
                          <TableHead>SpO₂</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Direkod oleh</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vitalRows.map(({ r, v }, i) => (
                          <TableRow key={`${r.id}-${i}`}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(r.date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {waktuLabel(WAKTU_VITAL_LABEL, v.waktu, v.masa)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.suhu != null ? `${v.suhu} °C` : "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {v.bpSistolik != null
                                ? `${v.bpSistolik}/${v.bpDiastolik} mmHg`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.nadi != null ? `${v.nadi} bpm` : "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.pernafasan != null
                                ? `${v.pernafasan} /min`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.gulaDarah != null
                                ? `${v.gulaDarah} mmol/L`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {v.oksigen != null ? `${v.oksigen}%` : "—"}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={v.status} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {v.pengesahan ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </section>
              )}

              {/* Ubatan table */}
              {ubatRows.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle icon={<Pill className="h-4 w-4" />}>
                    Ubatan
                  </SectionTitle>
                  <Card className="overflow-x-auto border-border/60 p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Tarikh</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Ubat</TableHead>
                          <TableHead>Dos</TableHead>
                          <TableHead>Cara Pengambilan</TableHead>
                          <TableHead>Catatan</TableHead>
                          <TableHead>Pengesahan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ubatRows.map(({ r, u, item }, i) => (
                          <TableRow key={`${r.id}-${i}`}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(r.date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {waktuLabel(WAKTU_UBATAN_LABEL, u.waktu, u.masa)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {item.namaUbat}
                              {item.prn && (
                                <span className="ml-1 rounded-full bg-status-attention/15 px-1.5 text-[10px] font-medium text-status-attention">
                                  PRN
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.dos}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.caraPengambilan}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.catatan ?? u.catatan ?? "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {u.pengesahan ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </section>
              )}

              {/* Makanan & Minuman table */}
              {makanRows.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle icon={<UtensilsCrossed className="h-4 w-4" />}>
                    Makanan & Minuman
                  </SectionTitle>
                  <Card className="overflow-x-auto border-border/60 p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Tarikh</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Makanan</TableHead>
                          <TableHead>Minuman</TableHead>
                          <TableHead>Kuantiti</TableHead>
                          <TableHead>Cecair</TableHead>
                          <TableHead>Catatan</TableHead>
                          <TableHead>Pengesahan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {makanRows.map(({ r, m }, i) => (
                          <TableRow key={`${r.id}-${i}`}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(r.date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {waktuLabel(WAKTU_MAKANAN_LABEL, m.waktu, m.masa)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {m.jenisMakanan ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {m.jenisMinum ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {m.kuantiti
                                ? (KUANTITI_LABEL[m.kuantiti] ?? m.kuantiti)
                                : "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {m.cecairMl != null ? `${m.cecairMl} ml` : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {m.catatan ?? "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {m.pengesahan ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </section>
              )}

              {/* Laporan Aktiviti Harian table */}
              {aktivitiRows.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle icon={<Activity className="h-4 w-4" />}>
                    Laporan Aktiviti Harian
                  </SectionTitle>
                  <Card className="overflow-x-auto border-border/60 p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Tarikh</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Aktiviti</TableHead>
                          <TableHead>Catatan Khas</TableHead>
                          <TableHead>Disahkan oleh</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aktivitiRows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {format(new Date(r.date), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={r.status} />
                            </TableCell>
                            <TableCell className="min-w-[240px] text-sm">
                              {r.aktiviti}
                            </TableCell>
                            <TableCell className="min-w-[180px] text-xs text-muted-foreground">
                              {r.catatanKhas ?? "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {r.aktivitiPengesahan ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="text-primary">{icon}</span>
      {children}
    </h2>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
