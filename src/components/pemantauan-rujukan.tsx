// Read-only Manual 3 charts (Bristol, urine colour, behaviour scales, clock
// turn, pain faces, fall-risk factors), shared by Buku 3 and the staff forms.
import { VITAL_STATUS_LABEL } from "@/lib/mock-data";
import type { VitalStatus } from "@/lib/mock-data";
import {
  BRISTOL,
  FAKTOR_RISIKO_JATUH,
  JADUAL_POSISI,
  NOTA_RISIKO_JATUH,
  POSISI,
  SKALA_KESAKITAN,
  SKALA_TINGKAH_LAKU,
  WARNA_URIN,
  cadanganPosisi,
  tafsiranBristol,
  tafsiranUrin,
  tahapKesakitan,
} from "@/lib/pemantauan";
import { cn } from "@/lib/utils";
import { MukaKesakitan } from "@/components/muka-kesakitan";

const TAHAP_CLS: Record<VitalStatus, string> = {
  normal: "bg-status-normal/10 text-status-normal ring-status-normal/30",
  amaran:
    "bg-status-attention/10 text-status-attention ring-status-attention/30",
  bahaya: "bg-status-critical/10 text-status-critical ring-status-critical/30",
};

/** Normal / Amaran / Bahaya pill, or a custom label in the same colour. */
export function TahapPill({
  tahap,
  label,
  className,
}: {
  tahap?: VitalStatus;
  label?: string;
  className?: string;
}) {
  if (!tahap) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
        TAHAP_CLS[tahap],
        className,
      )}
    >
      {label ?? VITAL_STATUS_LABEL[tahap]}
    </span>
  );
}

export function CartaBristol() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-semibold">Jenis</th>
            <th className="px-3 py-2 font-semibold">Rupa najis</th>
            <th className="px-3 py-2 font-semibold">Maksud</th>
          </tr>
        </thead>
        <tbody>
          {BRISTOL.map((b) => {
            const t = tafsiranBristol(b.jenis);
            return (
              <tr
                key={b.jenis}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-3 py-2 font-semibold">{b.jenis}</td>
                <td className="px-3 py-2">{b.label}</td>
                <td className="px-3 py-2">
                  <TahapPill tahap={t.tahap} label={t.label.split(" — ")[0]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CartaWarnaUrin() {
  const kumpulan = [
    { dari: 1, hingga: 3 },
    { dari: 4, hingga: 6 },
    { dari: 7, hingga: 8 },
  ];
  return (
    <div className="space-y-3">
      <div
        className="grid grid-cols-8 gap-1.5"
        role="list"
        aria-label="Carta warna urin"
      >
        {WARNA_URIN.map((w) => (
          <div key={w.tahap} role="listitem" className="text-center">
            <div
              className="h-9 rounded-md ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: w.warna }}
              aria-label={`Warna ${w.tahap}`}
            />
            <span className="mt-1 block text-[11px] font-semibold">
              {w.tahap}
            </span>
          </div>
        ))}
      </div>
      <ul className="space-y-1.5 text-xs">
        {kumpulan.map((k) => {
          const t = tafsiranUrin(k.dari);
          return (
            <li key={k.dari} className="flex items-center gap-2">
              <span className="w-10 shrink-0 font-semibold">
                {k.dari}–{k.hingga}
              </span>
              <TahapPill tahap={t.tahap} label={t.label} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SkalaTingkahLaku() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-semibold">Skor</th>
            {SKALA_TINGKAH_LAKU.map((s) => (
              <th key={s.key} className="px-3 py-2 font-semibold">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((skor) => (
            <tr key={skor} className="border-b border-border/50 last:border-0">
              <td className="px-3 py-2 font-semibold">{skor}</td>
              {SKALA_TINGKAH_LAKU.map((s) => (
                <td key={s.key} className="px-3 py-2">
                  {s.pilihan[skor - 1]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function JadualPusingan() {
  const label = (jam: number) =>
    POSISI.find((p) => p.key === cadanganPosisi(jam));
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-semibold">Masa</th>
            <th className="px-3 py-2 font-semibold">Posisi dicadangkan</th>
          </tr>
        </thead>
        <tbody>
          {JADUAL_POSISI.map((s) => {
            const p = label(s.jam);
            return (
              <tr
                key={s.label}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-3 py-2 font-medium">{s.label}</td>
                <td className="px-3 py-2">
                  {p?.label}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({p?.en})
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SkalaKesakitan() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {SKALA_KESAKITAN.map((k) => (
        <div
          key={k.skor}
          className={cn(
            "rounded-xl p-2 text-center ring-1 ring-inset",
            TAHAP_CLS[tahapKesakitan(k.skor)],
          )}
        >
          <MukaKesakitan skor={k.skor} className="mx-auto" />
          <span className="mt-1 block font-display text-base font-bold">
            {k.skor}
          </span>
          <span className="block text-[10px] leading-tight">{k.label}</span>
        </div>
      ))}
    </div>
  );
}

export function FaktorRisikoJatuh() {
  return (
    <div className="space-y-2">
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {FAKTOR_RISIKO_JATUH.map((f) => (
          <li key={f.key} className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
            {f.label}
          </li>
        ))}
      </ul>
      <p className="text-[11px] italic text-muted-foreground">
        {NOTA_RISIKO_JATUH}
      </p>
    </div>
  );
}
