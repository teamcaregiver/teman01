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
import { toast } from "sonner";
import { useState } from "react";
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
  const [photos, setPhotos] = useState<string[]>([]);

  if (!parent)
    return <p>{parents.length === 0 ? "Memuatkan…" : "Warga emas tidak dijumpai."}</p>;

  const back = () =>
    navigate({ to: "/staf/tracker/$parentId", params: { parentId } });

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotos((prev) => [
      ...prev,
      ...Array.from(files).map((file) => URL.createObjectURL(file)),
    ]);
  };

  const submit = async () => {
    if (!text.trim() && photos.length === 0) {
      toast.error("Tulis laporan atau tambah gambar");
      return;
    }
    try {
      await appendAktiviti(parentId, user?.id ?? "", user?.name ?? "", text, photos);
      invalidate(qk.trackers);
      toast.success("Laporan aktiviti direkod");
      back();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan laporan");
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
            {photos.map((g, i) => (
              <div
                key={i}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={g}
                  alt={`Aktiviti ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-background/80 text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground hover:bg-muted/40">
              <div className="flex flex-col items-center gap-1">
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px]">Tambah</span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addPhotos(e.target.files)}
              />
            </label>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={back}>
          Batal
        </Button>
        <Button type="button" onClick={submit}>
          Simpan Rekod
        </Button>
      </div>
    </div>
  );
}
