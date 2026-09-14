import {
  createFileRoute,
  useParams,
  useNavigate,
  Link,
} from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { appendAktiviti } from "@/lib/tracker-actions";
import { useParents, useInvalidate, qk } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import {
  IMAGE_ACCEPT,
  removeActivityPhotos,
  uploadActivityPhotos,
  validateImageFile,
} from "@/lib/storage";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Image as ImageIcon, X } from "lucide-react";
import { NowStamp } from "@/components/now-stamp";

export const Route = createFileRoute("/staf/tracker/$parentId/aktiviti")({
  component: AktivitiForm,
});

function AktivitiForm() {
  const { parentId } = useParams({ from: "/staf/tracker/$parentId/aktiviti" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const parents = useParents();
  const invalidate = useInvalidate();
  const parent = parents.find((p) => p.id === parentId);

  const [text, setText] = useState("");
  // Picked files stay local until Simpan; `preview` is an in-memory link used
  // only for the thumbnails on this page — it is never saved.
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const previews = useRef(new Set<string>());

  // Free every preview still held when the page closes.
  useEffect(() => {
    const held = previews.current;
    return () => held.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  if (!parent)
    return <p>{parents.length === 0 ? "Memuatkan…" : "Warga emas tidak dijumpai."}</p>;

  const back = () =>
    navigate({ to: "/staf/tracker/$parentId", params: { parentId } });

  const addPhotos = (input: HTMLInputElement) => {
    const picked = Array.from(input.files ?? []);
    input.value = ""; // allow picking the same file again after removing it
    const valid: { file: File; preview: string }[] = [];
    for (const file of picked) {
      const reason = validateImageFile(file);
      if (reason) {
        toast.error(`${file.name}: ${reason}`);
        continue;
      }
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      valid.push({ file, preview });
    }
    setPhotos((prev) => [...prev, ...valid]);
  };

  const removePhoto = (index: number) => {
    const target = photos[index];
    URL.revokeObjectURL(target.preview);
    previews.current.delete(target.preview);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!text.trim() && photos.length === 0) {
      toast.error("Tulis laporan atau tambah gambar");
      return;
    }
    setSaving(true);
    let uploaded: string[] = [];
    try {
      uploaded = await uploadActivityPhotos(parentId, photos.map((p) => p.file));
      await appendAktiviti(parentId, user?.id ?? "", user?.name ?? "", text, uploaded);
      invalidate(qk.trackers);
      toast.success("Laporan aktiviti direkod");
      back();
    } catch (e) {
      // The record was not saved, so don't leave its photos behind in storage.
      void removeActivityPhotos(uploaded);
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan laporan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        to="/staf/tracker/$parentId"
        params={{ parentId }}
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Rekod Harian
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold">
          Laporan Aktiviti Harian
        </h1>
        <p className="text-sm text-muted-foreground">
          Untuk:{" "}
          <span className="font-medium text-foreground">{parent.fullName}</span>{" "}
          · Masa direkod automatik bila disimpan.
        </p>
      </div>

      <NowStamp />

      <Card className="border-border/60 space-y-3 p-5">
        <Textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cth: Berjalan di taman pada waktu pagi, bermain teka silang kata, berbual dengan keluarga..."
        />
        <div>
          <Label className="text-xs">Gambar Aktiviti</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div
                key={p.preview}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={p.preview}
                  alt={`Aktiviti ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  disabled={saving}
                  aria-label={`Buang gambar ${i + 1}`}
                  onClick={() => removePhoto(i)}
                  className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-background/80 text-destructive disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label
              className={`grid h-20 w-20 place-items-center rounded-lg border border-dashed border-border text-muted-foreground ${
                saving ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/40"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px]">Tambah</span>
              </div>
              <input
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                disabled={saving}
                className="hidden"
                onChange={(e) => addPhotos(e.currentTarget)}
              />
            </label>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            JPG, PNG atau WebP · maksimum 5 MB setiap gambar. Hanya admin,
            staf bertugas dan keluarga warga emas ini boleh melihatnya.
          </p>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={back} disabled={saving}>
          Batal
        </Button>
        <Button type="button" onClick={submit} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Rekod"}
        </Button>
      </div>
    </div>
  );
}
