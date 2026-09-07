import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useParentQuery, useUsers, useTrackers, useInvalidate, qk } from "@/lib/data";
import { supabase } from "@/lib/supabase/client";
import { VitalCharts } from "@/components/vital-charts";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Archive, ArchiveRestore, ChevronLeft, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin/warga-emas/$parentId/")({
  component: WargaDetail,
});

function WargaDetail() {
  const { parentId } = useParams({ from: "/admin/warga-emas/$parentId/" });
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const parentQ = useParentQuery(parentId);
  const users = useUsers();
  const trackers = useTrackers();

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);

  const parent = parentQ.data ?? null;

  const setArchived = async (archived: boolean) => {
    if (!parent) return;
    setBusy(true);
    const { error } = await supabase
      .from("parents")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", parent.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    invalidate(qk.parents);
    setConfirmArchive(false);
    if (archived) {
      toast.success(`${parent.fullName} telah diarkibkan. Sejarah rekod dikekalkan.`);
      navigate({ to: "/admin/warga-emas" });
    } else {
      toast.success(`${parent.fullName} telah dipulihkan ke senarai aktif.`);
    }
  };

  if (parentQ.isPending) return <DetailSkeleton />;

  if (parentQ.isError)
    return (
      <EmptyPanel
        title="Gagal memuatkan maklumat"
        hint={(parentQ.error as Error).message}
        action={<Button variant="outline" size="sm" onClick={() => void parentQ.refetch()}>Cuba lagi</Button>}
      />
    );

  if (!parent)
    return (
      <EmptyPanel
        title="Warga emas tidak dijumpai"
        hint="Rekod ini mungkin telah dipadam atau pautan tidak sah."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/warga-emas">Kembali ke senarai</Link>
          </Button>
        }
      />
    );

  const archived = !!parent.archivedAt;
  const staff = users.find((u) => u.id === parent.staffId);
  const anak = users.filter((u) => parent.anakIds.includes(u.id));
  const rows = trackers
    .filter((t) => t.parentId === parentId)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const latest = rows[0];

  return (
    <div className="space-y-5">
      <Link to="/admin/warga-emas" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Kembali ke senarai
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl gradient-peach font-display text-lg font-bold text-peach-foreground">
            {parent.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{parent.fullName}</h1>
              {archived && (
                <Badge variant="outline" className="bg-muted text-muted-foreground">Diarkibkan</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {parent.ic} · {parent.gender === "L" ? "Lelaki" : "Perempuan"}
              {parent.relationship ? ` · ${parent.relationship}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {latest && <StatusBadge status={latest.status} />}
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/warga-emas/$parentId/edit" params={{ parentId }}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Link>
          </Button>
          {archived ? (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void setArchived(false)}>
              <ArchiveRestore className="mr-1 h-3.5 w-3.5" />
              {busy ? "Memproses..." : "Pulihkan"}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmArchive(true)}>
              <Archive className="mr-1 h-3.5 w-3.5" /> Arkib
            </Button>
          )}
        </div>
      </div>

      {archived && (
        <Card className="border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
          Warga emas ini diarkibkan pada{" "}
          <span className="font-medium text-foreground">
            {format(new Date(parent.archivedAt!), "dd MMM yyyy, HH:mm")}
          </span>
          . Rekod harian, tanda vital dan sejarah servis kekal utuh, tetapi nama
          ini tidak lagi dipaparkan dalam senarai aktif.
        </Card>
      )}

      {/* Profile details */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maklumat Peribadi</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Tarikh Lahir" value={parent.birthDate ? format(new Date(parent.birthDate), "dd MMM yyyy") : "—"} />
            <Item label="No. Telefon" value={parent.phone} />
            <Item label="Hubungan dengan Anak" value={parent.relationship} />
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
        {rows.length === 0 ? (
          <Card className="border-border/60 p-8 text-center text-sm text-muted-foreground">
            Tiada rekod harian lagi untuk warga emas ini.
          </Card>
        ) : (
          <VitalCharts records={rows} />
        )}
      </div>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arkibkan {parent.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {parent.fullName} akan disembunyikan daripada senarai warga emas
              aktif, dan tidak lagi muncul dalam senarai pilihan penjagaan. Rekod
              ini <span className="font-medium">tidak dipadam</span> — rekod
              harian, tanda vital, ubat-ubatan, pautan akaun anak dan sejarah
              servis semuanya dikekalkan, dan warga emas ini boleh dipulihkan
              pada bila-bila masa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void setArchived(true);
              }}
            >
              {busy ? "Mengarkib..." : "Ya, Arkibkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3.5 w-40" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-20 rounded-xl" />
    </div>
  );
}

function EmptyPanel({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
