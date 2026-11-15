import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * A reference picture (e.g. the Bristol Stool Chart). Tapping it opens it
 * larger in a pop-up on the same page instead of a new tab.
 */
export function GambarRujukan({
  src,
  tajuk,
  alt,
  width,
  height,
}: {
  src: string;
  /** Pop-up title, read by screen readers. */
  tajuk: string;
  alt: string;
  width: number;
  height: number;
}) {
  const [buka, setBuka] = useState(false);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setBuka(true)}
        aria-label={`Besarkan ${tajuk}`}
        className="mx-auto block w-full max-w-sm cursor-zoom-in overflow-hidden rounded-xl border border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto w-full"
        />
      </button>
      <p className="text-center text-[11px] text-muted-foreground">
        Ketik gambar untuk besarkan
      </p>

      <Dialog open={buka} onOpenChange={setBuka}>
        <DialogContent
          className="max-w-xl p-3 sm:p-4"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{tajuk}</DialogTitle>
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="mx-auto h-auto max-h-[85vh] w-auto max-w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
