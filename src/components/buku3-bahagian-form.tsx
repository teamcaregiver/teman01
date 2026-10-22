import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { RichTextEditor } from "@/components/rich-text-editor";
import { CoverImageField } from "@/components/cover-image-field";
import { PdfField, YoutubeField } from "@/components/content-attachments";
import { VISIBILITY_LABEL, isYoutubeInvalid } from "@/lib/mock-data";
import type { ContentVisibility } from "@/lib/mock-data";
import {
  BORANG_TEMANION,
  CARTA_RUJUKAN,
  bahagianAsal,
} from "@/lib/buku3-bahagian";
import type { Buku3Kunci } from "@/lib/buku3-bahagian";
import type { BahagianForm } from "@/lib/buku3-actions";
import { isBlank } from "@/lib/rich-text";
import { ChevronLeft, Info, RotateCcw } from "lucide-react";
import { toast } from "sonner";

// Same limits as the buku3_bahagian checks (migration 0014).
const TAJUK_MAX = 200;
const KANDUNGAN_MAX = 100_000;

interface Props {
  initial: BahagianForm;
  /** The built-in section being edited; none for a section admin adds. */
  kunci?: Buku3Kunci;
  heading: string;
  description: string;
  submitLabel: string;
  backLabel: string;
  /** Runs on submit; resolve to leave the page, reject/throw to stay. */
  onSubmit: (values: BahagianForm) => Promise<void>;
  /** Called for the Back / Cancel buttons once unsaved changes are resolved. */
  onLeave: () => void;
}

/**
 * The Buku 3 section form (Jadual Pemantauan), laid out like the Artikel
 * form. A built-in section keeps its charts and is always shown, so only its
 * title and text are edited; a section admin added also has a status.
 */
export function Buku3BahagianForm({
  initial,
  kunci,
  heading,
  description,
  submitLabel,
  backLabel,
  onSubmit,
  onLeave,
}: Props) {
  const [form, setForm] = useState<BahagianForm>(initial);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Re-seed when the edit page finishes loading its section.
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

  const set = <K extends keyof BahagianForm>(
    key: K,
    value: BahagianForm[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const requestLeave = () => (dirty ? setConfirmLeave(true) : onLeave());

  const asal = kunci ? bahagianAsal(kunci) : undefined;
  const carta = kunci ? CARTA_RUJUKAN[kunci] : undefined;
  const borang = kunci ? BORANG_TEMANION[kunci] : undefined;
  const sudahAsal =
    !!asal &&
    form.tajuk.trim() === asal.tajuk &&
    form.kandungan === asal.kandungan;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const tajuk = form.tajuk.trim();
    if (!tajuk) {
      toast.error("Sila isi tajuk bahagian.");
      return;
    }
    if (isBlank(form.kandungan)) {
      toast.error("Sila isi kandungan bahagian.");
      return;
    }
    if (isYoutubeInvalid(form.youtubeUrl)) {
      toast.error("Pautan YouTube tidak sah.");
      return;
    }
    if (form.kandungan.length > KANDUNGAN_MAX) {
      toast.error(
        "Kandungan terlalu panjang. Pecahkan kepada beberapa bahagian.",
      );
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...form, tajuk });
      setDirty(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan bahagian.",
      );
    } finally {
      setSaving(false);
    }
  };

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
          <SectionCard title="Maklumat Bahagian">
            <div className="space-y-4">
              <Field label="Tajuk Bahagian *">
                <Input
                  value={form.tajuk}
                  maxLength={TAJUK_MAX}
                  onChange={(e) => set("tajuk", e.target.value)}
                  placeholder="Cth: Unit 10: Penjagaan Kulit"
                />
              </Field>
              <CoverImageField
                value={form.coverImage}
                onChange={(url) => set("coverImage", url)}
                folder="buku3"
                disabled={saving}
              />
            </div>
          </SectionCard>

          <SectionCard title="Kandungan">
            <div className="space-y-4">
              <div className="space-y-3">
                <RichTextEditor
                  value={form.kandungan}
                  onChange={(html) => set("kandungan", html)}
                  placeholder="Tulis kandungan bahagian ini..."
                  ariaLabel="Kandungan bahagian"
                />
                {(carta || borang) && (
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {carta && (
                      <li className="flex items-start gap-1.5">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                        <span>
                          <span className="font-medium text-foreground">
                            {carta}
                          </span>{" "}
                          kekal dipaparkan di bawah teks ini.
                        </span>
                      </li>
                    )}
                    {borang && (
                      <li className="flex items-start gap-1.5">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
                        <span>
                          Teks ini juga dipaparkan kepada Temanion dalam Panduan
                          Buku 3 pada borang{" "}
                          <span className="font-medium text-foreground">
                            {borang}
                          </span>
                          .
                        </span>
                      </li>
                    )}
                  </ul>
                )}
                {asal && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 text-muted-foreground"
                    disabled={saving || sudahAsal}
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        tajuk: asal.tajuk,
                        kandungan: asal.kandungan,
                      }));
                      setDirty(true);
                    }}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Guna teks asal
                    Manual 3
                  </Button>
                )}
              </div>

              <Field label="Fail PDF (pilihan)">
                <PdfField
                  url={form.pdfUrl}
                  name={form.pdfName}
                  folder="buku3"
                  disabled={saving}
                  onUploadingChange={setUploadingPdf}
                  onChange={(pdfUrl, pdfName) => {
                    setForm((f) => ({ ...f, pdfUrl, pdfName }));
                    setDirty(true);
                  }}
                />
              </Field>

              <Field label="Pautan Video YouTube (pilihan)">
                <YoutubeField
                  value={form.youtubeUrl}
                  onChange={(url) => set("youtubeUrl", url)}
                />
              </Field>
            </div>
          </SectionCard>

          {!kunci && (
            <SectionCard title="Penerbitan">
              <Field label="Status">
                <Select
                  value={form.visibility}
                  onValueChange={(v) =>
                    set("visibility", v as ContentVisibility)
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Bahagian draf hanya kelihatan kepada admin sehingga
                  diterbitkan.
                </p>
              </Field>
            </SectionCard>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={requestLeave}
            disabled={saving}
          >
            Batal
          </Button>
          <Button type="submit" disabled={saving || uploadingPdf}>
            {saving ? "Menyimpan..." : submitLabel}
          </Button>
        </div>
      </form>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Buang perubahan yang belum disimpan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda telah mengubah borang ini tetapi belum menyimpannya. Jika
              anda keluar sekarang, perubahan tersebut akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Teruskan Mengedit</AlertDialogCancel>
            <AlertDialogAction onClick={onLeave}>
              Keluar Tanpa Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </Card>
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
