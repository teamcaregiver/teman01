import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Buku3BahagianForm } from "@/components/buku3-bahagian-form";
import {
  kemaskiniBahagianTambahan,
  simpanBahagianAsal,
} from "@/lib/buku3-actions";
import type { BahagianForm } from "@/lib/buku3-actions";
import { qk, useBuku3Query, useInvalidate } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/admin/jadual-pemantauan/$bahagianId/edit",
)({
  component: EditBahagian,
});

function EditBahagian() {
  const { bahagianId } = useParams({
    from: "/admin/jadual-pemantauan/$bahagianId/edit",
  });
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const q = useBuku3Query();
  const b = q.data?.find((x) => x.id === bahagianId);

  // Stable identity so the form only re-seeds when the saved section changes.
  const initial = useMemo<BahagianForm | null>(
    () =>
      b
        ? { tajuk: b.tajuk, kandungan: b.kandungan, visibility: b.visibility }
        : null,
    [b?.tajuk, b?.kandungan, b?.visibility], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const backToDetail = () =>
    navigate({
      to: "/admin/jadual-pemantauan/$bahagianId",
      params: { bahagianId },
    });

  const handleSubmit = async (values: BahagianForm) => {
    if (!b) return;
    if (b.kunci) await simpanBahagianAsal(b.kunci, values);
    else await kemaskiniBahagianTambahan(b.id, values);
    invalidate(qk.buku3);
    toast.success("Bahagian berjaya dikemaskini");
    backToDetail();
  };

  if (q.isPending)
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
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

  if (!b || !initial)
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

  return (
    <Buku3BahagianForm
      initial={initial}
      kunci={b.kunci}
      heading="Kemaskini Bahagian"
      description={b.tajuk}
      submitLabel="Simpan Perubahan"
      backLabel="Kembali ke bahagian"
      onSubmit={handleSubmit}
      onLeave={backToDetail}
    />
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
