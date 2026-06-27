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
  articles as initialArticles,
  VISIBILITY_LABEL,
  youtubeEmbed,
} from "@/lib/mock-data";
import type { Article, ContentVisibility } from "@/lib/mock-data";
import { TopicSubtopicFields } from "@/components/topic-subtopic-fields";
import {
  Eye,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video as VideoIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/artikel")({
  component: ArticlesPage,
});

const EMPTY_FORM = {
  title: "",
  topic: "",
  subtopic: "",
  coverImage: "",
  body: "",
  pdfUrl: "",
  pdfName: "",
  youtubeUrl: "",
  visibility: "published" as ContentVisibility,
};

function ArticlesPage() {
  const [list, setList] = useState<Article[]>(initialArticles);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: "add" | "edit";
    article?: Article;
  }>({ open: false, mode: "add" });
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [pdfPreview, setPdfPreview] = useState<Article | null>(null);
  const [videoPreview, setVideoPreview] = useState<Article | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const allSelected = list.length > 0 && selected.size === list.length;

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setDialog({ open: true, mode: "add" });
  };

  const openEdit = (a: Article) => {
    setForm({
      title: a.title,
      topic: a.topic,
      subtopic: a.subtopic,
      coverImage: a.coverImage,
      body: a.body,
      pdfUrl: a.pdfUrl ?? "",
      pdfName: a.pdfName ?? "",
      youtubeUrl: a.youtubeUrl ?? "",
      visibility: a.visibility ?? "published",
    });
    setDialog({ open: true, mode: "edit", article: a });
  };

  const handlePdfUpload = (file?: File) => {
    if (!file) return;
    setForm((f) => ({
      ...f,
      pdfUrl: URL.createObjectURL(file),
      pdfName: file.name,
    }));
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.topic) {
      toast.error("Sila isi tajuk dan topik.");
      return;
    }
    if (!form.body.trim() && !form.pdfUrl) {
      toast.error("Sila isi kandungan artikel atau muat naik PDF.");
      return;
    }
    const fields = {
      title: form.title,
      topic: form.topic,
      subtopic: form.subtopic,
      coverImage:
        form.coverImage ||
        "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&q=80",
      body: form.body,
      pdfUrl: form.pdfUrl || undefined,
      pdfName: form.pdfUrl ? form.pdfName || "lampiran.pdf" : undefined,
      youtubeUrl: form.youtubeUrl || undefined,
      visibility: form.visibility,
    };
    if (dialog.mode === "add") {
      setList((prev) => [
        {
          id: `a${Date.now()}`,
          views: 0,
          createdAt: new Date().toISOString(),
          ...fields,
        },
        ...prev,
      ]);
      toast.success("Artikel berjaya ditambah");
    } else if (dialog.article) {
      setList((prev) =>
        prev.map((a) =>
          a.id === dialog.article!.id ? { ...a, ...fields } : a,
        ),
      );
      toast.success("Artikel berjaya dikemaskini");
    }
    setDialog({ open: false, mode: "add" });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setList((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(deleteTarget.id);
      return n;
    });
    toast.success("Artikel dipadam");
    setDeleteTarget(null);
  };

  const deleteSelected = () => {
    setList((prev) => prev.filter((a) => !selected.has(a.id)));
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
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Artikel</h1>
          <p className="text-sm text-muted-foreground">
            Urus kandungan bacaan & PDF untuk anak.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" /> Artikel Baru
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
            {list.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Tiada artikel. Tambah artikel pertama.
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
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img
                        src={a.coverImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="line-clamp-1 max-w-[260px] text-xs text-muted-foreground">
                        {a.body}
                      </p>
                    </div>
                  </div>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit"
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="h-4 w-4" />
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
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === "add"
                ? "Tambah Artikel Baru"
                : "Kemaskini Artikel"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Tajuk Artikel *">
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Cth: Tips Penjagaan Warga Emas"
              />
            </Field>
            <TopicSubtopicFields
              topic={form.topic}
              subtopic={form.subtopic}
              onTopicChange={(topic) => setForm((f) => ({ ...f, topic }))}
              onSubtopicChange={(subtopic) =>
                setForm((f) => ({ ...f, subtopic }))
              }
              topicRequired
            />
            <Field label="URL Gambar Penutup">
              <Input
                value={form.coverImage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverImage: e.target.value }))
                }
                placeholder="https://..."
              />
            </Field>
            <Field label="Kandungan Artikel">
              <Textarea
                rows={5}
                value={form.body}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body: e.target.value }))
                }
                placeholder="Tulis kandungan artikel di sini..."
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Isi kandungan teks atau muat naik PDF — sekurang-kurangnya satu
                diperlukan.
              </p>
            </Field>

            <Field label="Fail PDF (kandungan utama, pilihan)">
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
              <Input
                className="mt-2"
                value={form.pdfUrl.startsWith("blob:") ? "" : form.pdfUrl}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pdfUrl: e.target.value,
                    pdfName: f.pdfName || "lampiran.pdf",
                  }))
                }
                placeholder="atau tampal URL PDF"
              />
            </Field>

            <Field label="Pautan Video YouTube (sokongan, pilihan)">
              <Input
                value={form.youtubeUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, youtubeUrl: e.target.value }))
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
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
              {dialog.mode === "add" ? "Simpan Artikel" : "Kemaskini"}
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
            <EmbeddedYoutube
              url={videoPreview.youtubeUrl}
              title={videoPreview.title}
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
            <AlertDialogTitle>Padam Artikel?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" akan dipadam secara kekal. Tindakan ini
              tidak boleh dibatalkan.
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

function EmbeddedYoutube({ url, title }: { url: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
      <iframe
        src={youtubeEmbed(url)}
        className="h-full w-full"
        allowFullScreen
        title={title}
      />
    </div>
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
