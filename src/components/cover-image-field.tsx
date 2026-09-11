import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IMAGE_ACCEPT,
  isValidImageUrl,
  uploadContentImage,
  validateImageFile,
} from "@/lib/storage";
import { AlertCircle, ImageIcon, Link2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type Mode = "upload" | "url";

interface Props {
  /** Current stored cover URL ("" when none). */
  value: string;
  onChange: (url: string) => void;
  folder: "articles" | "videos";
  /** Disables the whole control while the parent form is saving. */
  disabled?: boolean;
}

/**
 * Cover image picker with two interchangeable sources: a file upload that goes
 * to Supabase Storage, or a pasted image URL. Both end up as a plain URL string
 * in `value`, which is what the article row stores.
 */
export function CoverImageField({ value, onChange, folder, disabled }: Props) {
  const [mode, setMode] = useState<Mode>("upload");
  const [urlDraft, setUrlDraft] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep the URL box in sync when the parent loads/replaces the value.
  useEffect(() => {
    setUrlDraft(value);
    setPreviewBroken(false);
  }, [value]);

  const urlInvalid = mode === "url" && urlDraft.trim().length > 0 && !isValidImageUrl(urlDraft);

  const handleFile = async (file?: File) => {
    if (!file) return;
    const reason = validateImageFile(file);
    if (reason) {
      setUploadError(reason);
      toast.error(reason);
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await uploadContentImage(file, folder);
      onChange(url);
      toast.success("Gambar berjaya dimuat naik");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Muat naik gambar gagal";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const applyUrl = () => {
    const v = urlDraft.trim();
    if (!v) {
      onChange("");
      return;
    }
    if (!isValidImageUrl(v)) {
      toast.error("URL gambar tidak sah. Gunakan pautan http:// atau https://");
      return;
    }
    setPreviewBroken(false);
    onChange(v);
  };

  const clear = () => {
    onChange("");
    setUrlDraft("");
    setUploadError(null);
    setPreviewBroken(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Gambar Penutup</Label>

      {/* Source toggle */}
      <div
        role="group"
        aria-label="Kaedah gambar penutup"
        className="inline-flex rounded-full bg-muted p-0.5"
      >
        {(
          [
            { key: "upload", label: "Muat Naik", icon: Upload },
            { key: "url", label: "URL Gambar", icon: Link2 },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            disabled={disabled}
            onClick={() => setMode(t.key)}
            aria-pressed={mode === t.key}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === t.key
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" asChild disabled={disabled || uploading}>
              <label className="cursor-pointer">
                <Upload className="mr-1 h-3.5 w-3.5" />
                {uploading ? "Memuat naik..." : value ? "Ganti Gambar" : "Pilih Gambar"}
                <input
                  ref={fileRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  disabled={disabled || uploading}
                  onChange={(e) => void handleFile(e.target.files?.[0])}
                />
              </label>
            </Button>
            <span className="text-xs text-muted-foreground">
              JPG, JPEG, PNG atau WebP · maksimum 5 MB
            </span>
          </div>

          {uploading && (
            <div
              role="progressbar"
              aria-label="Memuat naik gambar"
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full w-full animate-pulse rounded-full bg-primary/70" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Input
              value={urlDraft}
              disabled={disabled}
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={applyUrl}
              placeholder="https://contoh.com/gambar.jpg"
              aria-invalid={urlInvalid || undefined}
              className="min-w-0 flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={applyUrl} disabled={disabled}>
              Guna URL
            </Button>
          </div>
          {urlInvalid && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> URL tidak sah. Gunakan pautan http:// atau https://
            </p>
          )}
        </div>
      )}

      {uploadError && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {uploadError}
        </p>
      )}

      {/* Preview */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/40">
        {value && !previewBroken ? (
          <div className="relative">
            <div className="aspect-[16/9] w-full bg-muted">
              <img
                src={value}
                alt="Pratonton gambar penutup"
                className="h-full w-full object-cover"
                onError={() => setPreviewBroken(true)}
                onLoad={() => setPreviewBroken(false)}
              />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-card px-3 py-2">
              <span className="truncate text-xs text-muted-foreground">{value}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={clear}
                disabled={disabled}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Buang
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
            {value && previewBroken ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-xs text-destructive">Gambar gagal dimuatkan</p>
                <p className="max-w-xs text-[11px] text-muted-foreground">
                  Periksa pautan tersebut, atau muat naik fail gambar sebagai ganti.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1 text-destructive hover:text-destructive"
                  onClick={clear}
                  disabled={disabled}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Buang
                </Button>
              </>
            ) : (
              <>
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Tiada gambar penutup dipilih</p>
                <p className="max-w-xs text-[11px] text-muted-foreground">
                  Gambar lalai akan digunakan jika ruangan ini dibiarkan kosong.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
