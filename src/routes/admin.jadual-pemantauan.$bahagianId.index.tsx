import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { IsiBahagian } from "@/components/buku3";
import {
  JenisBahagianBadge,
  StatusBahagianBadge,
} from "@/components/buku3-badge";
import { BORANG_TEMANION, CARTA_RUJUKAN } from "@/lib/buku3-bahagian";
import { padamBahagian, pulihkanBahagianAsal } from "@/lib/buku3-actions";
import { qk, useBuku3Query, useInvalidate } from "@/lib/data";
import { VISIBILITY_LABEL } from "@/lib/mock-data";
import { ChevronLeft, Info, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/jadual-pemantauan/$bahagianId/")({
  component: BahagianDetail,
});

function BahagianDetail() {
  const { bahagianId } = useParams({
    from: "/admin/jadual-pemantauan/$bahagianId/",
  });
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const q = useBuku3Query();
  const [confirm, setConfirm] = useState<"padam" | "pulihkan" | null>(null);
  const [busy, setBusy] = useState(false);

  const b = q.data?.find((x) => x.id === bahagianId);

  if (q.isPending)
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );

  if (q.isError)
    return (
      <StatusPanel
        title="Gagal memuatkan bahagian"
        hint={(q.error as Error).message}
        action={
          <Button variant="outline" size="sm" onClick={() => void q.refetch()}>
            Cuba lagi
          </Button>
        }
      />
    );

  if (!b)
    return (
      <StatusPanel
        title="Bahagian tidak dijumpai"
        hint="Bahagian ini mungkin telah dipadam atau pautan tidak sah."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/jadual-pemantauan">Kembali ke senarai</Link>
          </Button>
        }
      />
    );

  const carta = b.kunci ? CARTA_RUJUKAN[b.kunci] : undefined;
  const borang = b.kunci ? BORANG_TEMANION[b.kunci] : undefined;

  const run = async () => {
    setBusy(true);
    try {
      if (confirm === "padam") {
        await padamBahagian(b.id);
        invalidate(qk.buku3);
        toast.success("Bahagian dipadam");
        navigate({ to: "/admin/jadual-pemantauan" });
        return;
      }
      if (b.kunci) await pulihkanBahagianAsal(b.kunci);
      invalidate(qk.buku3);
      toast.success("Teks asal dikembalikan");
      setConfirm(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tindakan gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        to="/admin/jadual-pemantauan"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke senarai
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Buku 3 · Jadual Pemantauan
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight">
            {b.tajuk}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <JenisBahagianBadge bahagian={b} />
            <StatusBahagianBadge bahagian={b} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/admin/jadual-pemantauan/$bahagianId/edit"
              params={{ bahagianId: b.id }}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Link>
          </Button>
          {b.kunci ? (
            b.diubah && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirm("pulihkan")}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Kembalikan teks asal
              </Button>
            )
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirm("padam")}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Padam
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/60 p-4">
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Meta
            label="Jenis"
            value={b.kunci ? "Manual 3" : "Bahagian tambahan"}
          />
          <Meta label="Status" value={VISIBILITY_LABEL[b.visibility]} />
          <Meta
            label="Dikemas kini"
            value={
              b.updatedAt
                ? format(new Date(b.updatedAt), "dd MMM yyyy, HH:mm")
                : "—"
            }
          />
          <Meta label="Carta rujukan" value={carta ?? "—"} />
        </dl>
        {borang && (
          <p className="mt-3 flex items-start gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
            <span>
              Teks ini juga dipaparkan kepada Temanion dalam Panduan Buku 3 pada
              borang{" "}
              <span className="font-medium text-foreground">{borang}</span>.
            </span>
          </p>
        )}
      </Card>

      <Card className="space-y-3 border-border/60 p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Paparan untuk keluarga
        </h2>
        <IsiBahagian bahagian={b} />
      </Card>

      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "padam"
                ? "Padam bahagian?"
                : "Kembalikan teks asal?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "padam"
                ? `"${b.tajuk}" akan dipadam daripada Buku 3 secara kekal. Tindakan ini tidak boleh dibatalkan.`
                : "Tajuk dan teks bahagian ini akan kembali seperti dalam Manual 3. Kedudukannya dalam Buku 3 kekal."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void run();
              }}
              className={
                confirm === "padam"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {busy
                ? "Menyimpan..."
                : confirm === "padam"
                  ? "Ya, Padam"
                  : "Ya, Kembalikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium">{value}</dd>
    </div>
  );
}

function StatusPanel({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-3xl border-border/60 p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {hint}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}
