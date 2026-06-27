import type { TrackerRecord, VitalEntry } from "@/lib/mock-data";
import { HeartPulse, Pill, Utensils, ClipboardList } from "lucide-react";

function vitalSummary(v: VitalEntry): string {
  const parts: string[] = [];
  if (v.suhu != null) parts.push(`${v.suhu}°C`);
  if (v.bpSistolik != null) parts.push(`TD ${v.bpSistolik}/${v.bpDiastolik}`);
  if (v.nadi != null) parts.push(`Nadi ${v.nadi}`);
  if (v.gulaDarah != null) parts.push(`Gula ${v.gulaDarah}`);
  if (v.oksigen != null) parts.push(`SpO₂ ${v.oksigen}%`);
  return parts.join(" · ");
}

// The four daily care record categories (completion driven by a day's data).
// Shared by the Rekod Saya list and its dedicated detail page.
export function careCats(record?: TrackerRecord) {
  const vitals = record?.vitalEntries ?? [];
  const ubatan = (record?.ubatanEntries ?? []).filter(
    (u) => u.items.length > 0,
  );
  const makanan = (record?.makananEntries ?? []).filter(
    (m) => m.jenisMakanan || m.jenisMinum,
  );
  const lastVital = vitals[vitals.length - 1];
  const lastUbat = ubatan[ubatan.length - 1];
  const lastMakan = makanan[makanan.length - 1];

  return [
    {
      key: "vital",
      label: "Vital direkod",
      icon: HeartPulse,
      done: vitals.length > 0,
      masa: lastVital?.masa,
      detail: lastVital ? vitalSummary(lastVital) : "",
    },
    {
      key: "ubat",
      label: "Ubat direkod",
      icon: Pill,
      done: ubatan.length > 0,
      masa: lastUbat?.masa,
      detail: lastUbat ? lastUbat.items.map((i) => i.namaUbat).join(", ") : "",
    },
    {
      key: "makan",
      label: "Makanan & minuman direkod",
      icon: Utensils,
      done: makanan.length > 0,
      masa: lastMakan?.masa,
      detail: lastMakan
        ? [lastMakan.jenisMakanan, lastMakan.jenisMinum]
            .filter(Boolean)
            .join(" · ")
        : "",
    },
    {
      key: "aktiviti",
      label: "Laporan aktiviti direkod",
      icon: ClipboardList,
      done: !!record?.aktiviti,
      masa: undefined as string | undefined,
      detail: record?.aktiviti ? "Laporan ditulis" : "",
    },
  ];
}
