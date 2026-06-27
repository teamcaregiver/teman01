import {
  WAKTU_TIME,
  VITAL_STATUS_LABEL,
  entryTime,
  statusSuhu,
  statusTekanan,
  statusNadi,
  statusPernafasan,
  statusGulaDarah,
  statusOksigen,
} from "@/lib/mock-data";
import type {
  TrackerRecord,
  VitalEntry,
  UbatanEntry,
  MakananEntry,
  VitalStatus,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Thermometer,
  HeartPulse,
  Wind,
  Droplet,
  Activity as ActivityIcon,
  Pill,
  Utensils,
} from "lucide-react";

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
  prn: "PRN (bila perlu)",
  kecemasan: "Kecemasan",
};
const UBATAN_MASA: Record<string, string> = {
  pagi: "08:00",
  tengahari: "12:00",
  petang: "16:00",
  malam: "20:00",
  prn: "Bila perlu",
  kecemasan: "Ketika kecemasan",
};
const WAKTU_MAKANAN_LABEL: Record<string, string> = {
  pagi: "Pagi",
  snekPagi: "Snek Pagi / Brunch",
  tengahari: "Tengah Hari",
  minumPetang: "Minum Petang",
  makanMalam: "Makan Malam",
  snekMalam: "Snek Malam",
};
const MAKANAN_MASA: Record<string, string> = {
  pagi: "08:00",
  snekPagi: "10:30",
  tengahari: "13:00",
  minumPetang: "16:00",
  makanMalam: "19:00",
  snekMalam: "21:00",
};
const KUANTITI_LABEL: Record<string, string> = {
  tidakMakan: "Tidak Makan",
  suku: "Suku",
  separuh: "Separuh",
  tigaSuku: "3 Suku",
  penuh: "Penuh",
};

const VITAL_STATUS_CLS: Record<VitalStatus, string> = {
  normal: "bg-status-normal/10 text-status-normal ring-status-normal/30",
  amaran:
    "bg-status-attention/10 text-status-attention ring-status-attention/30",
  bahaya: "bg-status-critical/10 text-status-critical ring-status-critical/30",
};

function VitalStatusPill({ status }: { status?: VitalStatus }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        VITAL_STATUS_CLS[status],
      )}
    >
      {VITAL_STATUS_LABEL[status]}
    </span>
  );
}

type VitalColumn = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: (v: VitalEntry) => string | null;
  status: (v: VitalEntry) => VitalStatus | undefined;
};

const VITAL_COLUMNS: VitalColumn[] = [
  {
    key: "suhu",
    label: "Suhu",
    icon: Thermometer,
    value: (v) => (v.suhu != null ? `${v.suhu}°C` : null),
    status: (v) => statusSuhu(v.suhu),
  },
  {
    key: "bp",
    label: "Tekanan Darah",
    icon: HeartPulse,
    value: (v) =>
      v.bpSistolik != null ? `${v.bpSistolik}/${v.bpDiastolik}` : null,
    status: (v) => statusTekanan(v.bpSistolik, v.bpDiastolik),
  },
  {
    key: "nadi",
    label: "Nadi",
    icon: ActivityIcon,
    value: (v) => (v.nadi != null ? `${v.nadi} bpm` : null),
    status: (v) => statusNadi(v.nadi),
  },
  {
    key: "pernafasan",
    label: "Pernafasan",
    icon: Wind,
    value: (v) => (v.pernafasan != null ? `${v.pernafasan}/min` : null),
    status: (v) => statusPernafasan(v.pernafasan),
  },
  {
    key: "gula",
    label: "Gula Darah",
    icon: Droplet,
    value: (v) => (v.gulaDarah != null ? `${v.gulaDarah} mmol/L` : null),
    status: (v) => statusGulaDarah(v.gulaDarah),
  },
  {
    key: "oksigen",
    label: "Oksigen SpO₂",
    icon: ActivityIcon,
    value: (v) => (v.oksigen != null ? `${v.oksigen}%` : null),
    status: (v) => statusOksigen(v.oksigen),
  },
];

function VitalTable({ entries }: { entries: VitalEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground">
              Waktu
            </th>
            {VITAL_COLUMNS.map((c) => {
              const Icon = c.icon;
              return (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-1">
                    <Icon className="h-3 w-3" /> {c.label}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {entries.map((v, vi) => (
            <tr key={vi} className="border-b border-border/50 last:border-0">
              <td className="whitespace-nowrap px-3 py-2.5 align-top">
                <p className="text-xs font-semibold">
                  {v.waktu ? WAKTU_VITAL_LABEL[v.waktu] : "Rekod"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {entryTime(v.masa, v.waktu ? WAKTU_TIME[v.waktu] : undefined)}
                </p>
              </td>
              {VITAL_COLUMNS.map((c) => {
                const val = c.value(v);
                return (
                  <td
                    key={c.key}
                    className="whitespace-nowrap px-3 py-2.5 align-top"
                  >
                    {val == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold">{val}</p>
                        <VitalStatusPill status={c.status(v)} />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const UBAT_COLUMNS = [
  "Kategori Ubat",
  "Masa",
  "Nama Ubat",
  "Dos",
  "Cara Pengambilan",
  "Catatan",
  "Pengesahan",
];

function UbatTable({
  entries,
  showPengesahan,
}: {
  entries: UbatanEntry[];
  showPengesahan: boolean;
}) {
  const filtered = entries.filter((u) => u.items.length > 0);
  const columns = showPengesahan
    ? UBAT_COLUMNS
    : UBAT_COLUMNS.filter((c) => c !== "Pengesahan");
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {columns.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((u, ui) =>
            u.items.map((it, i) => (
              <tr
                key={`${ui}-${i}`}
                className="border-b border-border/50 last:border-0"
              >
                {i === 0 && (
                  <>
                    <td
                      rowSpan={u.items.length}
                      className="whitespace-nowrap px-3 py-2.5 align-top text-xs font-semibold"
                    >
                      {u.waktu ? WAKTU_UBATAN_LABEL[u.waktu] : "Rekod"}
                    </td>
                    <td
                      rowSpan={u.items.length}
                      className="whitespace-nowrap px-3 py-2.5 align-top text-xs text-muted-foreground"
                    >
                      {entryTime(
                        u.masa,
                        u.waktu ? UBATAN_MASA[u.waktu] : undefined,
                      )}
                    </td>
                  </>
                )}
                <td className="px-3 py-2.5 align-top font-medium">
                  {it.namaUbat}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 align-top">
                  {it.dos || "—"}
                </td>
                <td className="px-3 py-2.5 align-top">
                  {it.caraPengambilan || "—"}
                </td>
                <td className="px-3 py-2.5 align-top text-muted-foreground">
                  {it.catatan || "—"}
                </td>
                {showPengesahan && i === 0 && (
                  <td
                    rowSpan={u.items.length}
                    className="whitespace-nowrap px-3 py-2.5 align-top"
                  >
                    {u.pengesahan ? (
                      <span className="text-[11px] text-status-normal">
                        ✓ {u.pengesahan}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

const MAKAN_COLUMNS = [
  "Waktu Makan",
  "Masa",
  "Jenis Makanan / Minuman",
  "Kuantiti",
  "Pengambilan Cecair (mL)",
  "Catatan",
  "Pengesahan",
];

function MakanTable({
  entries,
  showPengesahan,
}: {
  entries: MakananEntry[];
  showPengesahan: boolean;
}) {
  const filtered = entries.filter((m) => m.jenisMakanan || m.jenisMinum);
  const columns = showPengesahan
    ? MAKAN_COLUMNS
    : MAKAN_COLUMNS.filter((c) => c !== "Pengesahan");
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {columns.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((m, mi) => (
            <tr key={mi} className="border-b border-border/50 last:border-0">
              <td className="whitespace-nowrap px-3 py-2.5 align-top text-xs font-semibold">
                {m.waktu ? WAKTU_MAKANAN_LABEL[m.waktu] : "Rekod"}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 align-top text-xs text-muted-foreground">
                {entryTime(m.masa, m.waktu ? MAKANAN_MASA[m.waktu] : undefined)}
              </td>
              <td className="px-3 py-2.5 align-top font-medium">
                {[m.jenisMakanan, m.jenisMinum].filter(Boolean).join(" · ") ||
                  "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 align-top">
                {m.kuantiti ? KUANTITI_LABEL[m.kuantiti] : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 align-top">
                {m.cecairMl != null ? `${m.cecairMl} mL` : "—"}
              </td>
              <td className="px-3 py-2.5 align-top text-muted-foreground">
                {m.catatan || "—"}
              </td>
              {showPengesahan && (
                <td className="whitespace-nowrap px-3 py-2.5 align-top">
                  {m.pengesahan ? (
                    <span className="text-[11px] text-status-normal">
                      ✓ {m.pengesahan}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AktivitiTable({
  record,
  showPengesahan,
}: {
  record: TrackerRecord;
  showPengesahan: boolean;
}) {
  const photos = record.gambar ?? [];
  const columns = showPengesahan
    ? ["Waktu", "Aktiviti", "Gambar", "Pengesahan"]
    : ["Waktu", "Aktiviti", "Gambar"];
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {columns.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/50 last:border-0">
            <td className="whitespace-nowrap px-3 py-2.5 align-top text-xs font-semibold">
              Harian
            </td>
            <td className="min-w-[16rem] px-3 py-2.5 align-top whitespace-pre-wrap">
              {record.aktiviti || "—"}
            </td>
            <td className="px-3 py-2.5 align-top">
              {photos.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {photos.map((g, i) => (
                    <a
                      key={i}
                      href={g}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-md"
                    >
                      <img
                        src={g}
                        alt={`Aktiviti ${i + 1}`}
                        className="h-12 w-12 object-cover transition-transform hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </td>
            {showPengesahan && (
              <td className="px-3 py-2.5 align-top">
                {record.aktivitiPengesahan ? (
                  <span className="whitespace-nowrap text-[11px] text-status-normal">
                    ✓ {record.aktivitiPengesahan}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VitalMetric({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status?: VitalStatus;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          {icon} {label}
        </span>
        <VitalStatusPill status={status} />
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

// Structured daily-care record rendered as one table per category (Tanda Vital,
// Ubatan, Makanan & Minuman, Laporan Aktiviti, Catatan Khas) on desktop, with
// card fallbacks on mobile. Shared by the family progress page and the staff
// Sejarah Rekod detail.
export function RecordReport({
  record,
  showPengesahan = true,
}: {
  record: TrackerRecord;
  // Pengesahan (who confirmed) is reference info for admin/family. On the staff
  // site the logged-in staff is the one confirming, so it's hidden there.
  showPengesahan?: boolean;
}) {
  const hasStructured =
    record.vitalEntries?.length ||
    record.ubatanEntries?.length ||
    record.makananEntries?.length ||
    record.aktiviti;

  if (!hasStructured) {
    // Legacy basic record fallback — each vital sign shows its own status.
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {record.bpSystolic != null && (
          <VitalMetric
            icon={<HeartPulse className="h-3 w-3" />}
            label="Tekanan Darah"
            value={`${record.bpSystolic}/${record.bpDiastolic} mmHg`}
            status={statusTekanan(record.bpSystolic, record.bpDiastolic)}
          />
        )}
        {record.bloodSugar != null && (
          <VitalMetric
            icon={<Droplet className="h-3 w-3" />}
            label="Gula Darah"
            value={`${record.bloodSugar} mmol/L`}
            status={statusGulaDarah(record.bloodSugar)}
          />
        )}
        {record.meal && (
          <div className="col-span-2 sm:col-span-3">
            <Info label="Makan" value={record.meal} />
          </div>
        )}
        {record.notes && (
          <div className="col-span-2 sm:col-span-3">
            <Info label="Catatan" value={record.notes} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vital signs — each sign validated & labelled independently.
          Desktop shows a table (all readings at a glance); mobile keeps cards. */}
      {record.vitalEntries && record.vitalEntries.length > 0 && (
        <Section
          icon={<HeartPulse className="h-3.5 w-3.5" />}
          title="Tanda Vital"
        >
          {/* Mobile: card view */}
          <div className="space-y-3 sm:hidden">
            {record.vitalEntries.map((v, vi) => (
              <div
                key={vi}
                className="rounded-xl border border-border/60 bg-muted/20 p-2.5"
              >
                <p className="mb-2 text-xs font-semibold">
                  {v.waktu ? WAKTU_VITAL_LABEL[v.waktu] : "Rekod"}{" "}
                  <span className="font-normal text-muted-foreground">
                    ·{" "}
                    {entryTime(
                      v.masa,
                      v.waktu ? WAKTU_TIME[v.waktu] : undefined,
                    )}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {v.suhu != null && (
                    <VitalMetric
                      icon={<Thermometer className="h-3 w-3" />}
                      label="Suhu"
                      value={`${v.suhu}°C`}
                      status={statusSuhu(v.suhu)}
                    />
                  )}
                  {v.bpSistolik != null && (
                    <VitalMetric
                      icon={<HeartPulse className="h-3 w-3" />}
                      label="Tekanan Darah"
                      value={`${v.bpSistolik}/${v.bpDiastolik}`}
                      status={statusTekanan(v.bpSistolik, v.bpDiastolik)}
                    />
                  )}
                  {v.nadi != null && (
                    <VitalMetric
                      icon={<ActivityIcon className="h-3 w-3" />}
                      label="Nadi"
                      value={`${v.nadi} bpm`}
                      status={statusNadi(v.nadi)}
                    />
                  )}
                  {v.pernafasan != null && (
                    <VitalMetric
                      icon={<Wind className="h-3 w-3" />}
                      label="Pernafasan"
                      value={`${v.pernafasan}/min`}
                      status={statusPernafasan(v.pernafasan)}
                    />
                  )}
                  {v.gulaDarah != null && (
                    <VitalMetric
                      icon={<Droplet className="h-3 w-3" />}
                      label="Gula Darah"
                      value={`${v.gulaDarah} mmol/L`}
                      status={statusGulaDarah(v.gulaDarah)}
                    />
                  )}
                  {v.oksigen != null && (
                    <VitalMetric
                      icon={<ActivityIcon className="h-3 w-3" />}
                      label="Oksigen SpO₂"
                      value={`${v.oksigen}%`}
                      status={statusOksigen(v.oksigen)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table view */}
          <div className="hidden sm:block">
            <VitalTable entries={record.vitalEntries} />
          </div>
        </Section>
      )}

      {/* Medication — desktop table; mobile keeps cards */}
      {record.ubatanEntries &&
        record.ubatanEntries.some((u) => u.items.length > 0) && (
          <Section icon={<Pill className="h-3.5 w-3.5" />} title="Ubatan">
            {/* Mobile: card view */}
            <div className="space-y-2 sm:hidden">
              {record.ubatanEntries
                .filter((u) => u.items.length > 0)
                .map((u, ui) => (
                  <div
                    key={ui}
                    className="rounded-lg border border-border p-2.5 text-xs"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold">
                        {u.waktu ? WAKTU_UBATAN_LABEL[u.waktu] : "Rekod"}{" "}
                        <span className="font-normal text-muted-foreground">
                          ·{" "}
                          {entryTime(
                            u.masa,
                            u.waktu ? UBATAN_MASA[u.waktu] : undefined,
                          )}
                        </span>
                      </span>
                      {showPengesahan && u.pengesahan && (
                        <span className="text-[11px] text-status-normal">
                          ✓ {u.pengesahan}
                        </span>
                      )}
                    </div>
                    {u.items.map((it, i) => (
                      <p key={i} className="text-muted-foreground">
                        {it.namaUbat} — {it.dos}{" "}
                        {it.caraPengambilan && `· ${it.caraPengambilan}`}
                        {it.catatan ? ` · ${it.catatan}` : ""}
                      </p>
                    ))}
                  </div>
                ))}
            </div>

            {/* Desktop: table view */}
            <div className="hidden sm:block">
              <UbatTable
                entries={record.ubatanEntries}
                showPengesahan={showPengesahan}
              />
            </div>
          </Section>
        )}

      {/* Meals — desktop table; mobile keeps cards */}
      {record.makananEntries &&
        record.makananEntries.some((m) => m.jenisMakanan || m.jenisMinum) && (
          <Section
            icon={<Utensils className="h-3.5 w-3.5" />}
            title="Makanan & Minuman"
          >
            {/* Mobile: card view */}
            <div className="space-y-2 sm:hidden">
              {record.makananEntries
                .filter((m) => m.jenisMakanan || m.jenisMinum)
                .map((m, mi) => (
                  <div
                    key={mi}
                    className="rounded-lg border border-border p-2.5 text-xs"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold">
                        {m.waktu ? WAKTU_MAKANAN_LABEL[m.waktu] : "Rekod"}{" "}
                        <span className="font-normal text-muted-foreground">
                          ·{" "}
                          {entryTime(
                            m.masa,
                            m.waktu ? MAKANAN_MASA[m.waktu] : undefined,
                          )}
                        </span>
                      </span>
                      {m.kuantiti && (
                        <span className="text-[11px] text-muted-foreground">
                          {KUANTITI_LABEL[m.kuantiti]}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {[m.jenisMakanan, m.jenisMinum]
                        .filter(Boolean)
                        .join(" · ")}
                      {m.cecairMl ? ` · ${m.cecairMl}ml` : ""}
                      {m.catatan ? ` · ${m.catatan}` : ""}
                    </p>
                  </div>
                ))}
            </div>

            {/* Desktop: table view */}
            <div className="hidden sm:block">
              <MakanTable
                entries={record.makananEntries}
                showPengesahan={showPengesahan}
              />
            </div>
          </Section>
        )}

      {/* Activity + photos — desktop table; mobile keeps text + photo grid */}
      {record.aktiviti && (
        <Section
          icon={<ActivityIcon className="h-3.5 w-3.5" />}
          title="Laporan Aktiviti"
        >
          {/* Mobile: text + photos */}
          <div className="space-y-2 sm:hidden">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {record.aktiviti}
            </p>
            {record.gambar && record.gambar.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {record.gambar.map((g, i) => (
                  <img
                    key={i}
                    src={g}
                    alt={`Aktiviti ${i + 1}`}
                    className="aspect-square rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
            {showPengesahan && record.aktivitiPengesahan && (
              <p className="text-[11px] text-status-normal">
                ✓ {record.aktivitiPengesahan}
              </p>
            )}
          </div>

          {/* Desktop: table view */}
          <div className="hidden sm:block">
            <AktivitiTable record={record} showPengesahan={showPengesahan} />
          </div>
        </Section>
      )}

      {record.catatanKhas && (
        <Section
          icon={<ActivityIcon className="h-3.5 w-3.5" />}
          title="Catatan Khas"
        >
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {record.catatanKhas}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
