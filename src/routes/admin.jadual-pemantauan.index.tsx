import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  JenisBahagianBadge,
  StatusBahagianBadge,
} from "@/components/buku3-badge";
import { CARTA_RUJUKAN, pindahBahagian } from "@/lib/buku3-bahagian";
import type { BahagianBuku3 } from "@/lib/buku3-bahagian";
import {
  padamBahagian,
  pulihkanBahagianAsal,
  simpanUrutan,
} from "@/lib/buku3-actions";
import { qk, useBuku3Query, useInvalidate } from "@/lib/data";
import { previewText } from "@/lib/rich-text";
import { OPENABLE_CLASS, openOnClick } from "@/lib/row-click";
import {
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/jadual-pemantauan/")({
  component: JadualPemantauanPage,
});

/** Buku 3 for admin: the Manual 3 sections, edited like Artikel. */
function JadualPemantauanPage() {
  const q = useBuku3Query();
  const list = q.data ?? [];
  const invalidate = useInvalidate();
  const navigate = useNavigate();
  const [moving, setMoving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BahagianBuku3 | null>(null);
  const [resetTarget, setResetTarget] = useState<BahagianBuku3 | null>(null);
  const [busy, setBusy] = useState(false);

  const move = async (b: BahagianBuku3, arah: -1 | 1) => {
    const changes = pindahBahagian(list, b.id, arah);
    if (changes.length === 0) return;
    setMoving(true);
    try {
      await simpanUrutan(changes);
      invalidate(qk.buku3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah susunan");
    } finally {
      setMoving(false);
    }
  };

  const run = async (action: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await action();
      invalidate(qk.buku3);
      toast.success(done);
      setDeleteTarget(null);
      setResetTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tindakan gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Jadual Pemantauan</h1>
          <p className="text-sm text-muted-foreground">
            Urus kandungan Buku 3 untuk keluarga dan Temanion.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/jadual-pemantauan/baru">
            <Plus className="mr-1 h-4 w-4" /> Bahagian Baru
          </Link>
        </Button>
      </div>

      <Card className="flex items-start gap-3 border-border/60 p-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-sage text-sage-foreground">
          <BookOpenCheck className="h-4 w-4" />
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Bahagian <span className="font-medium text-foreground">Manual 3</span>{" "}
          datang daripada manual asal. Anda boleh ubah tajuk dan teksnya, atau
          kembalikan teks asal; carta rujukannya (contoh: carta Bristol) kekal
          di bawah teks. Teks unit 5–9 juga dipaparkan kepada Temanion dalam
          Panduan Buku 3 pada borang pemantauan. Bahagian tambahan boleh
          disimpan sebagai draf atau dipadam.
        </p>
      </Card>

      <Card className="overflow-hidden border-border/60 p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 text-right">#</TableHead>
                <TableHead className="min-w-[260px]">Bahagian</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dikemas kini</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.isPending &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`s${i}`} className="hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {q.isError && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-10 text-center">
                    <p className="text-sm font-medium">
                      Gagal memuatkan Buku 3
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(q.error as Error).message}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => void q.refetch()}
                    >
                      Cuba lagi
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {list.map((b, i) => (
                <TableRow
                  key={b.id}
                  className={OPENABLE_CLASS}
                  {...openOnClick(
                    () =>
                      void navigate({
                        to: "/admin/jadual-pemantauan/$bahagianId",
                        params: { bahagianId: b.id },
                      }),
                    `Buka bahagian ${b.tajuk}`,
                  )}
                >
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{b.tajuk}</p>
                    <p className="line-clamp-1 max-w-[340px] text-xs text-muted-foreground">
                      {previewText(b.kandungan)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <JenisBahagianBadge bahagian={b} />
                    </div>
                    {b.kunci && CARTA_RUJUKAN[b.kunci] && (
                      <p className="mt-1 max-w-[200px] truncate text-[11px] text-muted-foreground">
                        + {CARTA_RUJUKAN[b.kunci]}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBahagianBadge bahagian={b} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {b.updatedAt
                      ? format(new Date(b.updatedAt), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Naik"
                        aria-label={`Naikkan ${b.tajuk}`}
                        disabled={moving || i === 0}
                        onClick={() => void move(b, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Turun"
                        aria-label={`Turunkan ${b.tajuk}`}
                        disabled={moving || i === list.length - 1}
                        onClick={() => void move(b, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Edit" asChild>
                        <Link
                          to="/admin/jadual-pemantauan/$bahagianId/edit"
                          params={{ bahagianId: b.id }}
                          aria-label={`Edit ${b.tajuk}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {b.kunci ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Kembalikan teks asal"
                          aria-label={`Kembalikan teks asal ${b.tajuk}`}
                          disabled={!b.diubah}
                          onClick={() => setResetTarget(b)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Padam"
                          aria-label={`Padam ${b.tajuk}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open && !busy) setResetTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kembalikan teks asal?</AlertDialogTitle>
            <AlertDialogDescription>
              Tajuk dan teks "{resetTarget?.tajuk}" akan kembali seperti dalam
              Manual 3. Kedudukannya dalam Buku 3 kekal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                const kunci = resetTarget?.kunci;
                if (kunci)
                  void run(
                    () => pulihkanBahagianAsal(kunci),
                    "Teks asal dikembalikan",
                  );
              }}
            >
              {busy ? "Menyimpan..." : "Ya, Kembalikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam bahagian?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.tajuk}" akan dipadam daripada Buku 3 secara kekal.
              Tindakan ini tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                const id = deleteTarget?.id;
                if (id) void run(() => padamBahagian(id), "Bahagian dipadam");
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Memadam..." : "Ya, Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
