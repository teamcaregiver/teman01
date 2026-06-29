import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  VISIBILITY_LABEL,
  YT_IFRAME_ALLOW,
  youtubeEmbed,
  youtubeThumb,
} from "@/lib/mock-data";
import type { Video, ContentVisibility } from "@/lib/mock-data";
import { useVideos, useInvalidate, qk } from "@/lib/data";
import { supabase } from "@/lib/supabase/client";
import { TopicSubtopicFields } from "@/components/topic-subtopic-fields";
import {
  ExternalLink,
  FileText,
  Pencil,
  Play,
  Plus,
  Trash2,
  Upload,
  Video as VideoIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/video")({
  component: VideosPage,
});

const EMPTY_FORM = {
  title: "",
  topic: "",
  subtopic: "",
  url: "",
  description: "",
  pdfUrl: "",
  pdfName: "",
  visibility: "published" as ContentVisibility,
};

function VideosPage() {
  const list = useVideos();
  const invalidate = useInvalidate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    video?: Video;
  }>({ open: false, mode: "add" });
  const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
  const [videoPreview, setVideoPreview] = useState<Video | null>(null);
  const [pdfPreview, setPdfPreview] = useState<Video | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const allSelected = list.length > 0 && selected.size === list.length;

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setDialog({ open: true, mode: "add" });
  };

  const openEdit = (v: Video) => {
    setForm({
      title: v.title,
      topic: v.topic,
      subtopic: v.subtopic,
      url: v.url,
      description: v.description,
      pdfUrl: v.pdfUrl ?? "",
      pdfName: v.pdfName ?? "",
      visibility: v.visibility ?? "published",
    });
    setDialog({ open: true, mode: "edit", video: v });
  };

  const handlePdfUpload = (file?: File) => {
    if (!file) return;
    setForm((f) => ({
      ...f,
      pdfUrl: URL.createObjectURL(file),
      pdfName: file.name,
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Sila isi tajuk dan URL video.");
      return;
    }
    const row = {
      title: form.title,
      topic: form.topic,
      subtopic: form.subtopic,
      url: youtubeEmbed(form.url) || form.url,
      description: form.description,
      pdf_url: form.pdfUrl || null,
      pdf_name: form.pdfUrl ? form.pdfName || "lampiran.pdf" : null,
      visibility: form.visibility,
    };
    if (dialog.mode === "add") {
      const { error } = await supabase.from("videos").insert(row);
      if (error) return toast.error(error.message);
      toast.success("Video berjaya ditambah");
    } else if (dialog.video) {
      const { error } = await supabase.from("videos").update(row).eq("id", dialog.video.id);
      if (error) return toast.error(error.message);
      toast.success("Video berjaya dikemaskini");
    }
    invalidate(qk.videos);
    setDialog({ open: false, mode: "add" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("videos").delete().eq("id", deleteTarget.id);
    if (error) return toast.error(error.message);
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(deleteTarget.id);
      return n;
    });
    invalidate(qk.videos);
    toast.success("Video dipadam");
    setDeleteTarget(null);
  };

  const deleteSelected = async () => {
    const { error } = await supabase.from("videos").delete().in("id", [...selected]);
    if (error) return toast.error(error.message);
    invalidate(qk.videos);
    toast.success(`${selected.size} video dipadam`);
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
    setSelected(allSelected ? new Set() : new Set(list.map((v) => v.id)));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Video</h1>
          <p className="text-sm text-muted-foreground">
            Urus video YouTube edukasi untuk keluarga.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" /> Video Baru
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
              <TableHead className="min-w-[280px]">Video</TableHead>
              <TableHead>Topik</TableHead>
              <TableHead>Subtopik</TableHead>
              <TableHead>Pautan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tarikh</TableHead>
              <TableHead className="text-right">Tontonan</TableHead>
              <TableHead className="text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Tiada video. Tambah video pertama.
                </TableCell>
              </TableRow>
            )}
            {list.map((v) => (
              <TableRow
                key={v.id}
                data-state={selected.has(v.id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(v.id)}
                    onCheckedChange={() => toggle(v.id)}
                    aria-label={`Pilih ${v.title}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVideoPreview(v)}
                      className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
                    >
                      {youtubeThumb(v.url) ? (
                        <img
                          src={youtubeThumb(v.url)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center">
                          <VideoIcon className="h-4 w-4 text-muted-foreground" />
                        </span>
                      )}
                      <span className="absolute inset-0 grid place-items-center bg-black/20">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </span>
                    </button>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{v.title}</p>
                      <p className="line-clamp-1 max-w-[260px] text-xs text-muted-foreground">
                        {v.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{v.topic || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {v.subtopic || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant="secondary"
                      className="bg-lavender/30 text-lavender-foreground gap-1"
                    >
                      <VideoIcon className="h-3 w-3" /> YouTube
                    </Badge>
                    {v.pdfUrl && (
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" /> PDF
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <VisibilityBadge value={v.visibility} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {format(new Date(v.createdAt), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {(v.views ?? 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Lihat Video"
                      onClick={() => setVideoPreview(v)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    {v.pdfUrl && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Lihat PDF"
                        onClick={() => setPdfPreview(v)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit"
                      onClick={() => openEdit(v)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Padam"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(v)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === "add" ? "Tambah Video Baru" : "Kemaskini Video"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Tajuk Video *">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Cth: Senaman Ringan untuk Warga Emas"
              />
            </Field>
            <TopicSubtopicFields
              topic={form.topic}
              subtopic={form.subtopic}
              onTopicChange={(topic) => setForm((f) => ({ ...f, topic }))}
              onSubtopicChange={(subtopic) =>
                setForm((f) => ({ ...f, subtopic }))
              }
            />
            <Field label="Pautan YouTube *">
              <Input
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Tampal pautan YouTube biasa atau embed — ia akan dijadikan embed
                automatik.
              </p>
              {youtubeThumb(form.url) && (
                <div className="mt-2 aspect-video w-full max-w-xs overflow-hidden rounded-md bg-black">
                  <iframe
                    src={youtubeEmbed(form.url)}
                    className="h-full w-full"
                    allow={YT_IFRAME_ALLOW}
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    title="Pratonton"
                  />
                </div>
              )}
            </Field>
            <Field label="Penerangan">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Ringkasan kandungan video..."
              />
            </Field>

            <Field label="Fail PDF Sokongan (pilihan)">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    <Upload className="mr-1 h-3.5 w-3.5" /> Muat Naik PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handlePdfUpload(e.target.files?.[0])}
                    />
                  </label>
                </Button>
                {form.pdfUrl ? (
                  <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {form.pdfName || "lampiran.pdf"}
                    </span>
                    <button
                      type="button"
                      className="text-destructive hover:underline"
                      onClick={() =>
                        setForm((f) => ({ ...f, pdfUrl: "", pdfName: "" }))
                      }
                    >
                      Buang
                    </button>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Tiada fail dipilih
                  </span>
                )}
              </div>
            </Field>

            <Field label="Status">
              <Select
                value={form.visibility}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, visibility: v as ContentVisibility }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">
                    {VISIBILITY_LABEL.published}
                  </SelectItem>
                  <SelectItem value="draft">
                    {VISIBILITY_LABEL.draft}
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialog((d) => ({ ...d, open: false }))}
            >
              Batal
            </Button>
            <Button onClick={handleSave}>
              {dialog.mode === "add" ? "Simpan Video" : "Kemaskini"}
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
          {videoPreview && (
            <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
              <iframe
                src={youtubeEmbed(videoPreview.url)}
                className="h-full w-full"
                allow={YT_IFRAME_ALLOW}
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                title={videoPreview.title}
              />
            </div>
          )}
          {videoPreview?.description && (
            <p className="text-sm text-muted-foreground">
              {videoPreview.description}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" asChild>
              <a href={videoPreview?.url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Buka di YouTube
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <AlertDialogTitle>Padam Video?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" akan dipadam secara kekal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Padam
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
