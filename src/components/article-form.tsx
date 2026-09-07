import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TopicSubtopicFields } from "@/components/topic-subtopic-fields";
import { CoverImageField } from "@/components/cover-image-field";
import { uploadContentPdf } from "@/lib/storage";
import {
  VISIBILITY_LABEL,
  YT_IFRAME_ALLOW,
  youtubeEmbed,
  youtubeId,
} from "@/lib/mock-data";
import type { ContentVisibility } from "@/lib/mock-data";
import type { ArticleFormValues } from "@/lib/articles";
import { AlertCircle, ChevronLeft, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initial: ArticleFormValues;
  heading: string;
  description: string;
  submitLabel: string;
  backLabel: string;
  /** Runs on submit; resolve to leave the page, reject/throw to stay. */
  onSubmit: (values: ArticleFormValues) => Promise<void>;
  /** Called for the Back / Cancel buttons once unsaved changes are resolved. */
  onLeave: () => void;
}

/**
 * The Artikel create/edit form. Both pages render this so the field set,
 * validation and unsaved-change guard stay identical between them.
 */
export function ArticleForm({
  initial,
  heading,
  description,
  submitLabel,
  backLabel,
  onSubmit,
  onLeave,
}: Props) {
  const [form, setForm] = useState<ArticleFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Re-seed when the edit page finishes loading its article.
  useEffect(() => {
    setForm(initial);
    setDirty(false);
  }, [initial]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const requestLeave = () => (dirty ? setConfirmLeave(true) : onLeave());

  const ytInvalid = form.youtubeUrl.trim().length > 0 && !youtubeId(form.youtubeUrl);

  const handlePdfUpload = async (file?: File) => {
    if (!file) return;
    setUploadingPdf(true);
    try {
      const { url, name } = await uploadContentPdf(file, "articles");
      setForm((f) => ({ ...f, pdfUrl: url, pdfName: name }));
      setDirty(true);
      toast.success("PDF berjaya dimuat naik");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Muat naik PDF gagal");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.title.trim() || !form.topic) {
      toast.error("Sila isi tajuk dan topik.");
      return;
    }
    if (!form.body.trim() && !form.pdfUrl) {
      toast.error("Sila isi kandungan artikel atau muat naik PDF.");
      return;
    }
    if (ytInvalid) {
      toast.error("Pautan YouTube tidak sah.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan artikel.");
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || uploadingPdf;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={requestLeave}
      >
        <ChevronLeft className="mr-1 h-4 w-4" /> {backLabel}
      </Button>

      <div>
        <h1 className="font-display text-2xl font-bold">{heading}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <SectionCard title="Maklumat Artikel">
            <div className="space-y-4">
              <Field label="Tajuk Artikel *">
                <Input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Cth: Tips Penjagaan Warga Emas"
                />
              </Field>
              <TopicSubtopicFields
                topic={form.topic}
                subtopic={form.subtopic}
                onTopicChange={(topic) => set("topic", topic)}
                onSubtopicChange={(subtopic) => set("subtopic", subtopic)}
                topicRequired
              />
              <CoverImageField
                value={form.coverImage}
                onChange={(url) => set("coverImage", url)}
                folder="articles"
                disabled={saving}
              />
            </div>
          </SectionCard>

          <SectionCard title="Kandungan">
            <div className="space-y-4">
              <Field label="Kandungan Artikel">
                <Textarea
                  rows={8}
                  value={form.body}
                  onChange={(e) => set("body", e.target.value)}
                  placeholder="Tulis kandungan artikel di sini..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Isi kandungan teks atau muat naik PDF — sekurang-kurangnya satu diperlukan.
                </p>
              </Field>

              <Field label="Fail PDF (kandungan utama, pilihan)">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" asChild disabled={busy}>
                    <label className="cursor-pointer">
                      <Upload className="mr-1 h-3.5 w-3.5" />
                      {uploadingPdf ? "Memuat naik..." : "Muat Naik PDF"}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={busy}
                        onChange={(e) => void handlePdfUpload(e.target.files?.[0])}
                      />
                    </label>
                  </Button>
                  {form.pdfUrl ? (
                    <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{form.pdfName || "lampiran.pdf"}</span>
                      <button
                        type="button"
                        className="cursor-pointer text-destructive hover:underline"
                        onClick={() => {
                          setForm((f) => ({ ...f, pdfUrl: "", pdfName: "" }));
                          setDirty(true);
                        }}
                      >
                        Buang
                      </button>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Tiada fail dipilih</span>
                  )}
                </div>
                <Input
                  className="mt-2"
                  value={form.pdfUrl.startsWith("blob:") ? "" : form.pdfUrl}
                  onChange={(e) => {
                    setForm((f) => ({
                      ...f,
                      pdfUrl: e.target.value,
                      pdfName: f.pdfName || "lampiran.pdf",
                    }));
                    setDirty(true);
                  }}
                  placeholder="atau tampal URL PDF"
                />
              </Field>

              <Field label="Pautan Video YouTube (sokongan, pilihan)">
                <Input
                  value={form.youtubeUrl}
                  onChange={(e) => set("youtubeUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  aria-invalid={ytInvalid || undefined}
                />
                {ytInvalid ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> Pautan YouTube tidak dikenali. Contoh:
                    https://www.youtube.com/watch?v=xxxxxxxxxxx
                  </p>
                ) : (
                  form.youtubeUrl.trim() && (
                    <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-black">
                      <iframe
                        src={youtubeEmbed(form.youtubeUrl)}
                        className="h-full w-full"
                        allow={YT_IFRAME_ALLOW}
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        title="Pratonton video"
                      />
                    </div>
                  )
                )}
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Penerbitan">
            <Field label="Status">
              <Select
                value={form.visibility}
                onValueChange={(v) => set("visibility", v as ContentVisibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">{VISIBILITY_LABEL.published}</SelectItem>
                  <SelectItem value="draft">{VISIBILITY_LABEL.draft}</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Artikel draf hanya kelihatan kepada admin sehingga diterbitkan.
              </p>
            </Field>
          </SectionCard>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={requestLeave} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" disabled={busy}>
            {saving ? "Menyimpan..." : submitLabel}
          </Button>
        </div>
      </form>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Buang perubahan yang belum disimpan?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda telah mengubah borang ini tetapi belum menyimpannya. Jika anda keluar
              sekarang, perubahan tersebut akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Teruskan Mengedit</AlertDialogCancel>
            <AlertDialogAction onClick={onLeave}>Keluar Tanpa Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/60 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
