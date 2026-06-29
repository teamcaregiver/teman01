import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParents, useUsers, useTrackers } from "@/lib/data";
import { VitalCharts } from "@/components/vital-charts";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/admin/warga-emas/$parentId")({
  component: WargaDetail,
});

function WargaDetail() {
  const { parentId } = useParams({ from: "/admin/warga-emas/$parentId" });
  const parents = useParents();
  const users = useUsers();
  const trackers = useTrackers();
  const parent = parents.find((p) => p.id === parentId);

  if (!parent)
    return <p>{parents.length === 0 ? "Memuatkan…" : "Warga emas tidak dijumpai."}</p>;

  const staff = users.find((u) => u.id === parent.staffId);
  const anak = users.filter((u) => parent.anakIds.includes(u.id));
  const rows = trackers.filter((t) => t.parentId === parentId).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const latest = rows[0];

  return (
    <div className="space-y-5">
      <Link to="/admin/warga-emas" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Kembali ke senarai
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl gradient-peach font-display text-lg font-bold text-peach-foreground">
            {parent.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{parent.fullName}</h1>
            <p className="text-sm text-muted-foreground">{parent.ic} · {parent.gender === "L" ? "Lelaki" : "Perempuan"} · {parent.relationship}</p>
          </div>
        </div>
        {latest && <StatusBadge status={latest.status} />}
      </div>

      {/* Profile details */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maklumat Peribadi</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Tarikh Lahir" value={parent.birthDate ? format(new Date(parent.birthDate), "dd MMM yyyy") : "—"} />
            <Item label="No. Telefon" value={parent.phone} />
            <Item label="Jenis Darah" value={parent.jenisDarah} />
            <Item label="Status Mobiliti" value={parent.statusMobiliti} />
            <Item label="Status Kognitif" value={parent.statusKognitif} />
            <Item label="No. Insurans" value={parent.noInsurans} />
            <div className="col-span-2"><Item label="Alamat" value={parent.address} /></div>
          </dl>
        </Card>

        <Card className="border-border/60 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maklumat Perubatan</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2"><Item label="Kondisi Perubatan" value={parent.medicalCondition} /></div>
            <div className="col-span-2"><Item label="Senarai Ubat" value={parent.medication} /></div>
            <Item label="Alahan" value={parent.alahan} />
            <Item label="Sekatan Pemakanan" value={parent.sekatanPemakanan} />
            <Item label="Doktor" value={parent.namaDoktor} />
            <Item label="Tel Doktor" value={parent.telDoktor} />
            <div className="col-span-2"><Item label="Hospital Rujukan" value={parent.hospitalRujukan} /></div>
            <div className="col-span-2"><Item label="Kontak Kecemasan" value={parent.emergencyContact} /></div>
          </dl>
        </Card>
      </div>

      {/* Assignments */}
      <Card className="border-border/60 p-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Penjaga Bertugas</p>
            <p className="mt-0.5 font-medium">{staff?.name ?? "Belum ditetapkan"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Anak Terpaut</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {anak.length > 0 ? anak.map(a => <Badge key={a.id} variant="secondary" className="bg-sage/20 text-sage-foreground">{a.name}</Badge>) : <span className="text-muted-foreground">—</span>}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Jumlah Rekod</p>
            <p className="mt-0.5 font-medium">{rows.length}</p>
          </div>
        </div>
      </Card>

      {/* Vital sign graphs */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold">Graf Tanda Vital</h2>
        <VitalCharts records={rows} />
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}
