import { Badge } from "@/components/ui/badge";
import { VISIBILITY_LABEL } from "@/lib/mock-data";
import type { BahagianBuku3 } from "@/lib/buku3-bahagian";

/** "Manual 3" or "Tambahan", plus "Diubah suai" for an edited Manual 3 section. */
export function JenisBahagianBadge({
  bahagian: b,
}: {
  bahagian: BahagianBuku3;
}) {
  return (
    <>
      {b.kunci ? (
        <Badge variant="secondary" className="bg-sage/25 text-sage-foreground">
          Manual 3
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="bg-lavender/30 text-lavender-foreground"
        >
          Tambahan
        </Badge>
      )}
      {b.diubah && (
        <Badge
          variant="outline"
          className="border-teal/40 bg-teal/15 text-teal-foreground"
        >
          Diubah suai
        </Badge>
      )}
    </>
  );
}

export function StatusBahagianBadge({
  bahagian: b,
}: {
  bahagian: BahagianBuku3;
}) {
  return b.visibility === "published" ? (
    <Badge variant="secondary" className="bg-sage/30 text-sage-foreground">
      {VISIBILITY_LABEL.published}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      {VISIBILITY_LABEL.draft}
    </Badge>
  );
}
