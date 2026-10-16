// The five Manual 3 monitoring tables inside a day's record report: a table
// on desktop, cards on mobile — same pattern as vital / ubat / makanan.
import { Droplets, Gauge, RotateCw, Smile, TriangleAlert } from "lucide-react";
import { entryTime } from "@/lib/mock-data";
import type { TrackerRecord } from "@/lib/mock-data";
import {
  FAKTOR_RISIKO_JATUH,
  JENIS_PERKUMUHAN_LABEL,
  SKALA_TINGKAH_LAKU,
  WAKTU_HARI_LABEL,
  labelKejadianJatuh,
  labelKesakitan,
  labelPosisi,
  labelSkorTingkahLaku,
  tafsiranPerkumuhan,
  tahapKesakitan,
  tahapRisikoJatuh,
  tahapSkorTingkahLaku,
  waktuHari,
} from "@/lib/pemantauan";
import { TahapPill } from "@/components/pemantauan-rujukan";
import { cn } from "@/lib/utils";

// `nowrap` keeps a score pill on one line in the desktop table (the table
// scrolls sideways when narrow); mobile cards still wrap.
type Lajur = { tajuk: string; pengesahan?: boolean; nowrap?: boolean };
type Baris = { key: string; sel: React.ReactNode[] };

export function PemantauanReport({
  record,
  showPengesahan,
}: {
  record: TrackerRecord;
  showPengesahan: boolean;
}) {
  const disahkan = (nama?: string) =>
    nama ? (
      <span className="whitespace-nowrap text-[11px] text-status-normal">
        ✓ {nama}
      </span>
    ) : (
      "—"
    );
  const waktu = (masa: string) => (
    <>
      <p className="text-xs font-semibold">
        {WAKTU_HARI_LABEL[waktuHari(masa)]}
      </p>
      <p className="text-[11px] text-muted-foreground">{entryTime(masa)}</p>
    </>
  );
  const teks = (s?: string) => (s?.trim() ? s : "—");

  return (
    <>
      {!!record.perkumuhanEntries?.length && (
        <Seksyen icon={<Droplets className="h-3.5 w-3.5" />} tajuk="Perkumuhan">
          <Jadual
            showPengesahan={showPengesahan}
            lajur={[
              { tajuk: "Waktu" },
              { tajuk: "Jenis" },
              { tajuk: "Kekerapan" },
              { tajuk: "Keadaan" },
              { tajuk: "Catatan" },
              { tajuk: "Pengesahan", pengesahan: true },
            ]}
            baris={record.perkumuhanEntries.map((e, i) => {
              const t = tafsiranPerkumuhan(e);
              const carta =
                e.jenis === "najis" && e.bristol
                  ? `Bristol jenis ${e.bristol}`
                  : e.jenis === "kencing" && e.warnaUrin
                    ? `Warna ${e.warnaUrin}/8`
                    : undefined;
              return {
                key: `p${i}`,
                sel: [
                  waktu(e.masa),
                  <span className="font-medium">
                    {JENIS_PERKUMUHAN_LABEL[e.jenis]}
                  </span>,
                  e.kekerapan ? `${e.kekerapan}×` : "—",
                  <div className="space-y-1">
                    {carta && <p className="text-xs">{carta}</p>}
                    {t && <TahapPill tahap={t.tahap} label={t.label} />}
                    {e.keadaan && (
                      <p className="text-xs text-muted-foreground">
                        {e.keadaan}
                      </p>
                    )}
                    {!carta && !t && !e.keadaan && "—"}
                  </div>,
                  teks(e.catatan),
                  disahkan(e.pengesahan),
                ],
              };
            })}
          />
        </Seksyen>
      )}

      {!!record.tingkahLakuEntries?.length && (
        <Seksyen
          icon={<Smile className="h-3.5 w-3.5" />}
          tajuk="Tingkah Laku & Emosi"
        >
          <Jadual
            showPengesahan={showPengesahan}
            lajur={[
              { tajuk: "Waktu" },
              ...SKALA_TINGKAH_LAKU.map((s) => ({
                tajuk: s.label,
                nowrap: true,
              })),
              { tajuk: "Catatan" },
              { tajuk: "Pengesahan", pengesahan: true },
            ]}
            baris={record.tingkahLakuEntries.map((e, i) => ({
              key: `t${i}`,
              sel: [
                waktu(e.masa),
                ...SKALA_TINGKAH_LAKU.map((s) => {
                  const skor = e[s.key];
                  const label = labelSkorTingkahLaku(s.key, skor);
                  return label && skor ? (
                    <TahapPill
                      tahap={tahapSkorTingkahLaku(skor)}
                      label={label}
                    />
                  ) : (
                    "—"
                  );
                }),
                teks(e.catatan),
                disahkan(e.pengesahan),
              ],
            }))}
          />
        </Seksyen>
      )}

      {!!record.posisiEntries?.length && (
        <Seksyen
          icon={<RotateCw className="h-3.5 w-3.5" />}
          tajuk="Penukaran Posisi"
        >
          <Jadual
            showPengesahan={showPengesahan}
            lajur={[
              { tajuk: "Masa" },
              { tajuk: "Posisi" },
              { tajuk: "Tujuan" },
              { tajuk: "Kulit" },
              { tajuk: "Catatan" },
              { tajuk: "Pengesahan", pengesahan: true },
            ]}
            baris={record.posisiEntries.map((e, i) => ({
              key: `o${i}`,
              sel: [
                <span className="text-xs font-semibold">
                  {entryTime(e.masa)}
                </span>,
                <span className="font-medium">{labelPosisi(e)}</span>,
                teks(e.tujuan),
                e.tandaLukaTekanan ? (
                  <TahapPill tahap="amaran" label="Tanda luka tekanan" />
                ) : (
                  <TahapPill tahap="normal" label="Baik" />
                ),
                teks(e.catatan),
                disahkan(e.pengesahan),
              ],
            }))}
          />
        </Seksyen>
      )}

      {!!record.kesakitanEntries?.length && (
        <Seksyen
          icon={<Gauge className="h-3.5 w-3.5" />}
          tajuk="Skor Kesakitan"
        >
          <Jadual
            showPengesahan={showPengesahan}
            lajur={[
              { tajuk: "Waktu" },
              { tajuk: "Skor (0–10)", nowrap: true },
              { tajuk: "Lokasi Kesakitan" },
              { tajuk: "Catatan" },
              { tajuk: "Pengesahan", pengesahan: true },
            ]}
            baris={record.kesakitanEntries.map((e, i) => ({
              key: `k${i}`,
              sel: [
                waktu(e.masa),
                <TahapPill
                  tahap={tahapKesakitan(e.skor)}
                  label={`${e.skor} · ${labelKesakitan(e.skor)}`}
                />,
                teks(e.lokasi),
                teks(e.catatan),
                disahkan(e.pengesahan),
              ],
            }))}
          />
        </Seksyen>
      )}

      {!!record.risikoJatuhEntries?.length && (
        <Seksyen
          icon={<TriangleAlert className="h-3.5 w-3.5" />}
          tajuk="Risiko Jatuh"
        >
          <Jadual
            showPengesahan={showPengesahan}
            lajur={[
              { tajuk: "Masa" },
              { tajuk: "Faktor Risiko (Ya)" },
              { tajuk: "Kejadian" },
              { tajuk: "Catatan" },
              { tajuk: "Pengesahan", pengesahan: true },
            ]}
            baris={record.risikoJatuhEntries.map((e, i) => ({
              key: `r${i}`,
              sel: [
                <span className="text-xs font-semibold">
                  {entryTime(e.masa)}
                </span>,
                <div className="space-y-1">
                  <TahapPill
                    tahap={tahapRisikoJatuh(e)}
                    label={`${e.faktor.length} / ${FAKTOR_RISIKO_JATUH.length} faktor`}
                  />
                  {e.faktor.length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                      {FAKTOR_RISIKO_JATUH.filter((f) =>
                        e.faktor.includes(f.key),
                      ).map((f) => (
                        <li key={f.key}>{f.label}</li>
                      ))}
                    </ul>
                  )}
                </div>,
                labelKejadianJatuh(e.kejadian),
                teks(e.catatan),
                disahkan(e.pengesahan),
              ],
            }))}
          />
        </Seksyen>
      )}
    </>
  );
}

/** Desktop: a table. Mobile: one card per entry, each cell labelled. */
function Jadual({
  lajur,
  baris,
  showPengesahan,
}: {
  lajur: Lajur[];
  baris: Baris[];
  showPengesahan: boolean;
}) {
  const nampak = lajur.map((l) => showPengesahan || !l.pengesahan);
  const lajurNampak = lajur.filter((_, i) => nampak[i]);
  const sel = (b: Baris) => b.sel.filter((_, i) => nampak[i]);

  return (
    <>
      <div className="space-y-2 sm:hidden">
        {baris.map((b) => (
          <dl
            key={b.key}
            className="space-y-1.5 rounded-lg border border-border p-2.5 text-xs"
          >
            {sel(b).map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <dt className="w-24 shrink-0 text-[11px] text-muted-foreground">
                  {lajurNampak[i].tajuk}
                </dt>
                <dd className="min-w-0 flex-1">{c}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-border/60 sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {lajurNampak.map((l) => (
                <th
                  key={l.tajuk}
                  className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground"
                >
                  {l.tajuk}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr
                key={b.key}
                className="border-b border-border/50 last:border-0"
              >
                {sel(b).map((c, i) => (
                  <td
                    key={i}
                    className={cn(
                      "px-3 py-2.5 align-top",
                      lajurNampak[i].nowrap && "whitespace-nowrap",
                    )}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Seksyen({
  icon,
  tajuk,
  children,
}: {
  icon: React.ReactNode;
  tajuk: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {tajuk}
      </p>
      {children}
    </div>
  );
}
