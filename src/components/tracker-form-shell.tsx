import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpenCheck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NowStamp } from "@/components/now-stamp";
import { RichText } from "@/components/rich-text";
import type { Buku3UnitId } from "@/lib/buku3";
import { bahagianAsal } from "@/lib/buku3-bahagian";
import { useBuku3 } from "@/lib/data";

/**
 * Frame shared by the Manual 3 monitoring forms: back link, who the record is
 * for, the live timestamp, the unit's general instructions from Buku 3, and
 * the Batal / Simpan buttons.
 */
export function TrackerFormShell({
  parentId,
  parentName,
  tajuk,
  unit,
  saving,
  onSubmit,
  children,
}: {
  parentId: string;
  parentName: string;
  tajuk: string;
  unit: Buku3UnitId;
  saving: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  // The unit's section as admin last saved it (Jadual Pemantauan page).
  const panduan = useBuku3().find((b) => b.kunci === unit) ?? bahagianAsal(unit)!;
  const back = () =>
    navigate({ to: "/staf/tracker/$parentId", params: { parentId } });

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
        <h1 className="font-display text-2xl font-bold">{tajuk}</h1>
        <p className="text-sm text-muted-foreground">
          Untuk:{" "}
          <span className="font-medium text-foreground">{parentName}</span> ·
          Masa direkod automatik bila disimpan.
        </p>
      </div>

      <NowStamp />

      <details className="group rounded-xl border border-border/60 bg-card p-3 text-xs">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium">
          <BookOpenCheck className="h-4 w-4 shrink-0 text-teal" />
          Panduan Buku 3 · {panduan.tajuk}
          <span className="ml-auto text-muted-foreground group-open:hidden">
            Lihat
          </span>
          <span className="ml-auto hidden text-muted-foreground group-open:inline">
            Tutup
          </span>
        </summary>
        <RichText
          content={panduan.kandungan}
          className="mt-3 text-muted-foreground"
        />
      </details>

      {children}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={back} disabled={saving}>
          Batal
        </Button>
        <Button type="button" onClick={onSubmit} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Rekod"}
        </Button>
      </div>
    </div>
  );
}

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] font-medium text-muted-foreground"
    >
      {children}
    </label>
  );
}
