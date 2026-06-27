import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  WAKTU_TIME,
  VITAL_STATUS_LABEL,
  statusSuhu,
  statusTekanan,
  statusNadi,
  statusPernafasan,
  statusGulaDarah,
  statusOksigen,
} from "@/lib/mock-data";
import type { TrackerRecord, WaktuVital, VitalStatus } from "@/lib/mock-data";

const WAKTU_ORDER: Record<WaktuVital, number> = {
  pagi: 0,
  tengahari: 1,
  petang: 2,
  malam: 3,
};

// Status → colour. The point/marker for each reading is painted with the
// colour of ITS OWN status (Normal hijau · Amaran kuning · Bahaya merah), while
// the connecting line stays a neutral metric colour. Tooltip uses the same map.
const STATUS_COLOR: Record<VitalStatus, string> = {
  normal: "var(--status-normal)",
  amaran: "var(--status-attention)",
  bahaya: "var(--status-critical)",
};

type StatusKey =
  | "suhuStatus"
  | "bpStatus"
  | "nadiStatus"
  | "pernafasanStatus"
  | "gulaStatus"
  | "oksigenStatus";

type Point = {
  label: string;
  suhu?: number;
  sistolik?: number;
  diastolik?: number;
  nadi?: number;
  pernafasan?: number;
  gula?: number;
  oksigen?: number;
  // Per-reading status used to colour the marker + tooltip.
  suhuStatus?: VitalStatus;
  bpStatus?: VitalStatus;
  nadiStatus?: VitalStatus;
  pernafasanStatus?: VitalStatus;
  gulaStatus?: VitalStatus;
  oksigenStatus?: VitalStatus;
};

type LineConfig = {
  dataKey: keyof Point;
  name: string;
  color: string;
  statusKey: StatusKey;
};
type VitalConfig = {
  key: string;
  title: string;
  unit: string;
  statusKey: StatusKey;
  lines: LineConfig[];
};

const VITALS: VitalConfig[] = [
  {
    key: "suhu",
    title: "Suhu Badan",
    unit: "°C",
    statusKey: "suhuStatus",
    lines: [
      {
        dataKey: "suhu",
        name: "Suhu",
        color: "oklch(0.65 0.18 35)",
        statusKey: "suhuStatus",
      },
    ],
  },
  {
    key: "bp",
    title: "Tekanan Darah",
    unit: "mmHg",
    statusKey: "bpStatus",
    lines: [
      {
        dataKey: "sistolik",
        name: "Sistolik",
        color: "oklch(0.6 0.15 200)",
        statusKey: "bpStatus",
      },
      {
        dataKey: "diastolik",
        name: "Diastolik",
        color: "oklch(0.7 0.12 200)",
        statusKey: "bpStatus",
      },
    ],
  },
  {
    key: "nadi",
    title: "Nadi",
    unit: "bpm",
    statusKey: "nadiStatus",
    lines: [
      {
        dataKey: "nadi",
        name: "Nadi",
        color: "oklch(0.6 0.2 350)",
        statusKey: "nadiStatus",
      },
    ],
  },
  {
    key: "pernafasan",
    title: "Pernafasan",
    unit: "/min",
    statusKey: "pernafasanStatus",
    lines: [
      {
        dataKey: "pernafasan",
        name: "Pernafasan",
        color: "oklch(0.62 0.15 160)",
        statusKey: "pernafasanStatus",
      },
    ],
  },
  {
    key: "gula",
    title: "Gula Darah",
    unit: "mmol/L",
    statusKey: "gulaStatus",
    lines: [
      {
        dataKey: "gula",
        name: "Gula",
        color: "oklch(0.6 0.18 60)",
        statusKey: "gulaStatus",
      },
    ],
  },
  {
    key: "oksigen",
    title: "Oksigen SpO₂",
    unit: "%",
    statusKey: "oksigenStatus",
    lines: [
      {
        dataKey: "oksigen",
        name: "SpO₂",
        color: "oklch(0.55 0.16 260)",
        statusKey: "oksigenStatus",
      },
    ],
  },
];

// Builds chart points for the selected day/range. The x-axis is TIME (e.g.
// 08:00, 12:00, 16:00, 20:00) because one elderly can have several vital
// reports in the same day, recorded waktu by waktu. When the range spans more
// than one day, the date is prefixed (dd/MM HH:mm) so points stay distinct.
function buildPoints(records: TrackerRecord[]): Point[] {
  const days = new Set(
    records.map((r) => format(new Date(r.date), "yyyy-MM-dd")),
  );
  const multiDay = days.size > 1;

  const rows = records.flatMap((r) =>
    (r.vitalEntries ?? []).map((v) => {
      // Real-time entries carry an exact timestamp; legacy entries map their
      // waktu slot to a representative clock time.
      const time = v.masa
        ? format(new Date(v.masa), "HH:mm")
        : v.waktu
          ? WAKTU_TIME[v.waktu]
          : "";
      const sortOffset = v.masa
        ? new Date(v.masa).getHours() * 60 + new Date(v.masa).getMinutes()
        : v.waktu
          ? WAKTU_ORDER[v.waktu]
          : 0;
      return {
        sort: +new Date(r.date) + sortOffset,
        point: {
          label: multiDay
            ? `${format(new Date(r.date), "dd/MM")} ${time}`.trim()
            : time,
          suhu: v.suhu,
          sistolik: v.bpSistolik,
          diastolik: v.bpDiastolik,
          nadi: v.nadi,
          pernafasan: v.pernafasan,
          gula: v.gulaDarah,
          oksigen: v.oksigen,
          // Each reading carries its own per-vital status for marker colouring.
          suhuStatus: statusSuhu(v.suhu),
          bpStatus: statusTekanan(v.bpSistolik, v.bpDiastolik),
          nadiStatus: statusNadi(v.nadi),
          pernafasanStatus: statusPernafasan(v.pernafasan),
          gulaStatus: statusGulaDarah(v.gulaDarah),
          oksigenStatus: statusOksigen(v.oksigen),
        } as Point,
      };
    }),
  );

  // Sort chronologically so the line reads left (earliest) to right (latest).
  return rows.sort((a, b) => a.sort - b.sort).map((r) => r.point);
}

// Marker painted with the status colour of the reading at this point. The line
// itself stays neutral; only the dot reflects Normal / Amaran / Bahaya.
function makeDot(statusKey: StatusKey, baseColor: string, radius: number) {
  // Typed loosely because recharts' LineDot render signature is `(props: any)`.
  return function StatusDot(props: any): React.ReactElement {
    const cx = props?.cx as number | undefined;
    const cy = props?.cy as number | undefined;
    const payload = props?.payload as Point | undefined;
    // recharts requires a ReactElement (not null); render nothing for gaps.
    if (cx == null || cy == null) return <g />;
    const st = payload?.[statusKey];
    const fill = st ? STATUS_COLOR[st] : baseColor;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke="white"
        strokeWidth={1.5}
      />
    );
  };
}

type TooltipEntry = {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
  payload?: Point;
};

// Tooltip shows time, each reading value + unit, and the reading status with a
// matching status colour (Normal hijau · Amaran kuning · Bahaya merah).
function ChartTooltip({
  active,
  payload,
  label,
  unit,
  statusKey,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  unit: string;
  statusKey: StatusKey;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const st = point?.[statusKey];
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">
            {p.value} {unit}
          </span>
        </div>
      ))}
      {st && (
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: STATUS_COLOR[st] }}
          />
          <span className="font-semibold" style={{ color: STATUS_COLOR[st] }}>
            Status: {VITAL_STATUS_LABEL[st]}
          </span>
        </div>
      )}
    </div>
  );
}

export function VitalCharts({ records }: { records: TrackerRecord[] }) {
  const points = buildPoints(records);

  if (points.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
        Belum ada bacaan tanda vital untuk dipaparkan.
      </Card>
    );
  }

  // Only render a chart if at least one point has data for one of its lines.
  const visible = VITALS.filter((v) =>
    v.lines.some((l) => points.some((p) => p[l.dataKey] != null)),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {visible.map((v, i) => (
        <motion.div
          key={v.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="border-border/60 p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-display text-sm font-semibold">{v.title}</p>
              <span className="text-xs text-muted-foreground">{v.unit}</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={points}
                  margin={{ left: -16, right: 8, top: 6, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.92 0.008 200)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip
                    content={
                      <ChartTooltip unit={v.unit} statusKey={v.statusKey} />
                    }
                  />
                  {v.lines.length > 1 && (
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  )}
                  {v.lines.map((l) => (
                    <Line
                      key={String(l.dataKey)}
                      type="monotone"
                      dataKey={String(l.dataKey)}
                      name={l.name}
                      stroke={l.color}
                      strokeWidth={2.5}
                      dot={makeDot(l.statusKey, l.color, 4) as never}
                      activeDot={makeDot(l.statusKey, l.color, 6) as never}
                      connectNulls
                      animationDuration={700}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
