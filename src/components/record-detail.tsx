import { parents, users, entryTime } from "@/lib/mock-data";
import type { TrackerRecord } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

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

// Read-only view of a single daily-care record. Shared by the admin Rekod
// Harian monitoring page and the admin Servis Monitoring detail. Admin can
// inspect everything but cannot edit — there are no actions here.
export function RecordDetail({ record }: { record: TrackerRecord }) {
  const p = parents.find((x) => x.id === record.parentId);
  const s = users.find((x) => x.id === record.staffId);

  return (
    <div className="space-y-5 pb-2">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="text-sm font-semibold text-foreground">
          {p?.fullName ?? "Warga Emas"}
        </span>
        <span>·</span>
        <span>{format(new Date(record.date), "dd MMM yyyy, HH:mm")}</span>
        <span>·</span>
        <span>
          Staf:{" "}
          <span className="font-medium text-foreground">{s?.name ?? "—"}</span>
        </span>
        <StatusBadge status={record.status} />
        {record.editedByAdmin && (
          <Badge
            variant="outline"
            className="border-lavender/40 bg-lavender/20 text-lavender-foreground"
          >
            Telah diedit oleh Admin
          </Badge>
        )}
      </div>

      {/* Legacy Basic Info */}
      {(record.bpSystolic ||
        record.bloodSugar ||
        record.meal ||
        record.notes) && (
        <Section title="Maklumat Asas">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {record.bpSystolic && (
              <Info
                label="Tekanan Darah"
                value={`${record.bpSystolic}/${record.bpDiastolic} mmHg`}
              />
            )}
            {record.bloodSugar && (
              <Info label="Gula Darah" value={`${record.bloodSugar} mmol/L`} />
            )}
            {record.meal && (
              <div className="col-span-2">
                <Info label="Makan" value={record.meal} />
              </div>
            )}
            {record.notes && (
              <div className="col-span-2">
                <Info label="Catatan" value={record.notes} />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Vital Signs */}
      {record.vitalEntries && record.vitalEntries.length > 0 && (
        <Section title="Tanda Vital">
          <div className="space-y-3">
            {record.vitalEntries.map((v, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {v.waktu ? WAKTU_VITAL_LABEL[v.waktu] : entryTime(v.masa)}
                  </span>
                  <StatusBadge status={v.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {v.suhu && <Info label="Suhu" value={`${v.suhu} °C`} />}
                  {v.bpSistolik && (
                    <Info
                      label="Tekanan Darah"
                      value={`${v.bpSistolik}/${v.bpDiastolik} mmHg`}
                    />
                  )}
                  {v.nadi && <Info label="Nadi" value={`${v.nadi} bpm`} />}
                  {v.pernafasan && (
                    <Info label="Pernafasan" value={`${v.pernafasan} b/min`} />
                  )}
                  {v.gulaDarah && (
                    <Info label="Gula Darah" value={`${v.gulaDarah} mmol/L`} />
                  )}
                  {v.oksigen && (
                    <Info label="Oksigen SpO₂" value={`${v.oksigen}%`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Ubatan */}
      {record.ubatanEntries &&
        record.ubatanEntries.some((u) => u.items.length > 0) && (
          <Section title="Ubatan">
            <div className="space-y-3">
              {record.ubatanEntries
                .filter((u) => u.items.length > 0)
                .map((u, ui) => (
                  <div key={ui}>
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {u.waktu
                          ? WAKTU_UBATAN_LABEL[u.waktu]
                          : entryTime(u.masa)}
                      </p>
                      {u.pengesahan && (
                        <p className="text-[11px] text-status-normal">
                          ✓ {u.pengesahan}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {u.items.map((item, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-muted/30 p-2 text-xs"
                        >
                          <p className="font-medium">
                            {item.namaUbat} — {item.dos}
                            {item.prn && (
                              <span className="ml-1 rounded-full bg-status-attention/15 px-1.5 text-[10px] font-medium text-status-attention">
                                PRN
                              </span>
                            )}
                          </p>
                          <p className="text-muted-foreground">
                            {item.caraPengambilan}
                            {item.catatan ? ` · ${item.catatan}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                    {u.catatan && (
                      <p className="mt-1 text-[11px] italic text-muted-foreground">
                        Nota: {u.catatan}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </Section>
        )}

      {/* Makanan */}
      {record.makananEntries &&
        record.makananEntries.some((m) => m.jenisMakanan || m.jenisMinum) && (
          <Section title="Makanan & Minuman">
            <div className="space-y-3">
              {record.makananEntries
                .filter((m) => m.jenisMakanan || m.jenisMinum)
                .map((m, mi) => (
                  <div key={mi} className="rounded-lg border border-border p-3">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      {m.waktu
                        ? WAKTU_MAKANAN_LABEL[m.waktu]
                        : entryTime(m.masa)}
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {m.jenisMakanan && (
                        <Info label="Makanan" value={m.jenisMakanan} />
                      )}
                      {m.jenisMinum && (
                        <Info label="Minuman" value={m.jenisMinum} />
                      )}
                      {m.kuantiti && (
                        <Info
                          label="Kuantiti"
                          value={KUANTITI_LABEL[m.kuantiti] ?? m.kuantiti}
                        />
                      )}
                      {m.cecairMl && (
                        <Info label="Cecair" value={`${m.cecairMl} ml`} />
                      )}
                      {m.catatan && (
                        <div className="col-span-2">
                          <Info label="Catatan" value={m.catatan} />
                        </div>
                      )}
                      {m.pengesahan && (
                        <div className="col-span-2">
                          <Info label="Pengesahan" value={m.pengesahan} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        )}

      {/* Aktiviti + gambar */}
      {record.aktiviti && (
        <Section title="Laporan Aktiviti Harian">
          <p className="whitespace-pre-wrap text-sm">{record.aktiviti}</p>
          {record.aktivitiPengesahan && (
            <p className="mt-1 text-[11px] text-status-normal">
              ✓ Disahkan oleh {record.aktivitiPengesahan}
            </p>
          )}
          {record.gambar && record.gambar.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Gambar dimuat naik
              </p>
              <div className="grid grid-cols-3 gap-2">
                {record.gambar.map((g, i) => (
                  <a
                    key={i}
                    href={g}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative overflow-hidden rounded-lg"
                  >
                    <img
                      src={g}
                      alt={`Gambar ${i + 1}`}
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Checklist */}
      {record.checklist && record.checklist.length > 0 && (
        <Section title="Senarai Semak">
          <div className="space-y-1.5">
            {record.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <div
                  className={`grid h-4 w-4 flex-shrink-0 place-items-center rounded border ${item.done ? "border-status-normal bg-status-normal" : "border-border"}`}
                >
                  {item.done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={
                    item.done ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Catatan Khas */}
      {record.catatanKhas && (
        <Section title="Catatan Khas">
          <p className="whitespace-pre-wrap text-sm">{record.catatanKhas}</p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
