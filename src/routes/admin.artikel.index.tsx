import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { VISIBILITY_LABEL, YT_IFRAME_ALLOW, youtubeEmbed } from "@/lib/mock-data";
import type { Article, ContentVisibility } from "@/lib/mock-data";
import { useArticlesQuery, useInvalidate, qk } from "@/lib/data";
import { supabase } from "@/lib/supabase/client";
import {
  Eye,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Video as VideoIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/artikel/")({
  component: ArticlesPage,
});

function ArticlesPage() {
  const articlesQ = useArticlesQuery();
  const list = articlesQ.data ?? [];
  const invalidate = useInvalidate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [pdfPreview, setPdfPreview] = useState<Article | null>(null);
  const [videoPreview, setVideoPreview] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  const allSelected = list.length > 0 && selected.size === list.length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("articles").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(deleteTarget.id);
      return n;
    });
    invalidate(qk.articles);
    toast.success("Artikel dipadam");
    setDeleteTarget(null);
  };

  const deleteSelected = async () => {
    const { error } = await supabase.from("articles").delete().in("id", [...selected]);
    if (error) return toast.error(error.message);
    invalidate(qk.articles);
    toast.success(`${selected.size} artikel dipadam`);
    setSelected(new Set());
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(list.map((a) => a.id)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Artikel</h1>
          <p className="text-sm text-muted-foreground">
            Urus kandungan bacaan & PDF untuk anak.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/artikel/baru">
            <Plus className="mr-1 h-4 w-4" /> Artikel Baru
          </Link>
        </Button>
      </div>

      <Card className="border-border/60 p-0 overflow-hidden">
        {selected.size > 0 && (
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
            <span className="text-sm text-muted-foreground">
              {selected.size} dipilih
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={deleteSelected}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Padam dipilih
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Pilih semua"
                  />
                </TableHead>
                <TableHead className="min-w-[280px]">Kandungan</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Topik</TableHead>
                <TableHead>Subtopik</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarikh</TableHead>
                <TableHead className="text-right">Tontonan</TableHead>
                <TableHead className="text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articlesQ.isPending &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`s${i}`}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {articlesQ.isError && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center">
                    <p className="text-sm font-medium">Gagal memuatkan artikel</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(articlesQ.error as Error).message}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => void articlesQ.refetch()}
                    >
                      Cuba lagi
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {!articlesQ.isPending && !articlesQ.isError && list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center">
                    <p className="text-sm font-medium">Tiada artikel lagi</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cipta artikel pertama untuk dikongsi dengan anak.
                    </p>
                    <Button size="sm" className="mt-3" asChild>
                      <Link to="/admin/artikel/baru">
                        <Plus className="mr-1 h-4 w-4" /> Artikel Baru
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {list.map((a) => (
                <TableRow
                  key={a.id}
                  data-state={selected.has(a.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(a.id)}
                      onCheckedChange={() => toggle(a.id)}
                      aria-label={`Pilih ${a.title}`}
                    />
                  </TableCell>
                  {/* The content cell is the row's link target. */}
                  <TableCell className="p-0">
                    <Link
                      to="/admin/artikel/$articleId"
                      params={{ articleId: a.id }}
                      aria-label={`Buka artikel ${a.title}`}
                      className="group flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                        <img
                          src={a.coverImage}
                          alt=""
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium group-hover:text-primary group-hover:underline">
                          {a.title}
                        </p>
                        <p className="line-clamp-1 max-w-[260px] text-xs text-muted-foreground">
                          {a.body}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant="secondary"
                        className="bg-teal/25 text-teal-foreground"
                      >
                        Artikel
                      </Badge>
                      {a.pdfUrl && (
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" /> PDF
                        </Badge>
                      )}
                      {a.youtubeUrl && (
                        <Badge variant="outline" className="gap-1">
                          <VideoIcon className="h-3 w-3" /> Video
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.topic}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.subtopic || "—"}
                  </TableCell>
                  <TableCell>
                    <VisibilityBadge value={a.visibility} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {format(new Date(a.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {(a.views ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      {a.pdfUrl && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Lihat PDF"
                          onClick={() => setPdfPreview(a)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {a.youtubeUrl && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Lihat Video"
                          onClick={() => setVideoPreview(a)}
                        >
                          <VideoIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Edit" asChild>
                        <Link to="/admin/artikel/$articleId/edit" params={{ articleId: a.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Padam"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(a)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* PDF Preview */}
      <Dialog
        open={!!pdfPreview}
        onOpenChange={(open) => {
          if (!open) setPdfPreview(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> {pdfPreview?.title}
            </DialogTitle>
          </DialogHeader>
          {pdfPreview?.pdfUrl && (
            <iframe
              src={pdfPreview.pdfUrl}
              title="Pratonton PDF"
              className="h-[70vh] w-full rounded-md border border-border"
            />
          )}
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={pdfPreview?.pdfUrl} target="_blank" rel="noreferrer">
                <Eye className="mr-1 h-3.5 w-3.5" /> Buka dalam tab baru
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview */}
      <Dialog
        open={!!videoPreview}
        onOpenChange={(open) => {
          if (!open) setVideoPreview(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" /> {videoPreview?.title}
            </DialogTitle>
          </DialogHeader>
          {videoPreview?.youtubeUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
              <iframe
                src={youtubeEmbed(videoPreview.youtubeUrl)}
                className="h-full w-full"
                allow={YT_IFRAME_ALLOW}
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                title={videoPreview.title}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Artikel?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" akan dipadam secara kekal. Tindakan ini
              tidak boleh dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Memadam..." : "Ya, Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VisibilityBadge({ value }: { value?: ContentVisibility }) {
  const v = value ?? "published";
  return v === "published" ? (
    <Badge variant="secondary" className="bg-sage/30 text-sage-foreground">
      {VISIBILITY_LABEL.published}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      {VISIBILITY_LABEL.draft}
    </Badge>
  );
}
