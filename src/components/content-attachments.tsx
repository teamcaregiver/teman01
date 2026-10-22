// PDF and YouTube attachments, shared by Artikel and Jadual Pemantauan (Buku 3)
// so both look and behave the same: form fields, detail-page cards and the
// quick-preview dialogs on the list pages.
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadContentPdf, type ContentFolder } from "@/lib/storage";
import {
  YT_IFRAME_ALLOW,
  isYoutubeInvalid,
  youtubeEmbed,
  youtubeId,
} from "@/lib/mock-data";
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
  Upload,
  Video as VideoIcon,
} from "lucide-react";
import { toast } from "sonner";

// ---------- form fields ----------

/** Upload a PDF (or paste its URL). `name` is shown instead of the URL. */
export function PdfField({
  url,
  name,
  folder,
  disabled,
  onChange,
  onUploadingChange,
}: {
  url: string;
  name: string;
  folder: ContentFolder;
  disabled?: boolean;
  onChange: (url: string, name: string) => void;
  /** Lets the form keep Save disabled while a file is uploading. */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const busy = disabled || uploading;

  const handleUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const res = await uploadContentPdf(file, folder);
      onChange(res.url, res.name);
      toast.success("PDF berjaya dimuat naik");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Muat naik PDF gagal");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
          disabled={busy}
        >
          <label className="cursor-pointer">
            <Upload className="mr-1 h-3.5 w-3.5" />
            {uploading ? "Memuat naik..." : "Muat Naik PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={busy}
              onChange={(e) => void handleUpload(e.target.files?.[0])}
            />
          </label>
        </Button>
        {url ? (
          <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{name || "lampiran.pdf"}</span>
            <button
              type="button"
              className="cursor-pointer text-destructive hover:underline"
              onClick={() => onChange("", "")}
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
        value={url.startsWith("blob:") ? "" : url}
        onChange={(e) => onChange(e.target.value, name || "lampiran.pdf")}
        placeholder="atau tampal URL PDF"
      />
    </>
  );
}

/** A YouTube link with a live preview, or a hint when it isn't recognised. */
export function YoutubeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const invalid = isYoutubeInvalid(value);
  return (
    <>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=..."
        aria-invalid={invalid || undefined}
      />
      {invalid ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> Pautan YouTube tidak dikenali.
          Contoh: https://www.youtube.com/watch?v=xxxxxxxxxxx
        </p>
      ) : (
        value.trim() && (
          <div className="mt-2 aspect-video w-full overflow-hidden rounded-md bg-black">
            <iframe
              src={youtubeEmbed(value)}
              className="h-full w-full"
              allow={YT_IFRAME_ALLOW}
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              title="Pratonton video"
            />
          </div>
        )
      )}
    </>
  );
}

// ---------- detail-page cards ----------

export function PdfCard({
  url,
  name,
  title,
}: {
  url: string;
  name?: string;
  title: string;
}) {
  return (
    <Card className="border-border/60 p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <FileText className="h-3.5 w-3.5" /> Dokumen PDF
        </h2>
        <PdfButtons url={url} name={name} />
      </div>
      <p className="mb-2 truncate text-xs text-muted-foreground">
        {name || "lampiran.pdf"}
      </p>
      <div className="overflow-hidden rounded-md border border-border">
        <iframe src={url} title={`PDF: ${title}`} className="h-[70vh] w-full" />
      </div>
    </Card>
  );
}

/** "Open in a new tab" and "Download" for a PDF. */
export function PdfButtons({ url, name }: { url: string; name?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" asChild>
        <a href={url} target="_blank" rel="noreferrer">
          <Eye className="mr-1 h-3.5 w-3.5" /> Buka tab baru
        </a>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <a href={url} download={name || true}>
          <Download className="mr-1 h-3.5 w-3.5" /> Muat Turun
        </a>
      </Button>
    </div>
  );
}

export function VideoCard({ url, title }: { url: string; title: string }) {
  return (
    <Card className="border-border/60 p-6">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <VideoIcon className="h-3.5 w-3.5" /> Video Berkaitan
      </h2>
      <VideoEmbed url={url} title={title} />
    </Card>
  );
}

/** The YouTube player, or a link to the original when it isn't YouTube. */
export function VideoEmbed({ url, title }: { url: string; title: string }) {
  return youtubeId(url) ? (
    <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
      <iframe
        src={youtubeEmbed(url)}
        className="h-full w-full"
        allow={YT_IFRAME_ALLOW}
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        title={title}
      />
    </div>
  ) : (
    <div className="rounded-md bg-muted/40 p-4 text-xs text-muted-foreground">
      Pautan video tidak dikenali sebagai YouTube.{" "}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline"
      >
        Buka pautan asal
      </a>
    </div>
  );
}

// ---------- list-page previews ----------

type Preview = { title: string; url: string } | null;

export function PdfPreviewDialog({
  item,
  onClose,
}: {
  item: Preview;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> {item?.title}
          </DialogTitle>
        </DialogHeader>
        {item?.url && (
          <iframe
            src={item.url}
            title="Pratonton PDF"
            className="h-[70vh] w-full rounded-md border border-border"
          />
        )}
        <DialogFooter>
          <Button variant="outline" asChild>
            <a href={item?.url} target="_blank" rel="noreferrer">
              <Eye className="mr-1 h-3.5 w-3.5" /> Buka dalam tab baru
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VideoPreviewDialog({
  item,
  onClose,
}: {
  item: Preview;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <VideoIcon className="h-4 w-4" /> {item?.title}
          </DialogTitle>
        </DialogHeader>
        {item?.url && (
          <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
            <iframe
              src={youtubeEmbed(item.url)}
              className="h-full w-full"
              allow={YT_IFRAME_ALLOW}
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              title={item.title}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
