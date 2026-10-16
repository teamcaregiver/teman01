import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LOKASI,
  SEMUA_LOKASI,
  TIADA_LOKASI,
  lokasiOptions,
} from "@/lib/lokasi";
import { cn } from "@/lib/utils";

// Radix Select cannot hold an empty value, so "not set" has its own key.
const BELUM = "__belum__";

/** Picks one location from the fixed list; "" means not set. */
export function LokasiSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (lokasi: string) => void;
  id?: string;
}) {
  // A value saved before the list existed stays selectable.
  const options =
    value && !LOKASI.includes(value) ? [...LOKASI, value] : LOKASI;
  return (
    <Select
      value={value || BELUM}
      onValueChange={(v) => onChange(v === BELUM ? "" : v)}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder="Pilih lokasi" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={BELUM}>Belum ditetapkan</SelectItem>
        {options.map((l) => (
          <SelectItem key={l} value={l}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** List filter: every location, one location, or records without one. */
export function LokasiFilter({
  value,
  onChange,
  values,
  className,
}: {
  value: string;
  onChange: (filter: string) => void;
  /** Locations saved on the listed records (extra values get an option too). */
  values: (string | null | undefined)[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Tapis mengikut lokasi"
        className={cn("w-full sm:w-52", className)}
      >
        {/* A div, not a span: SelectTrigger line-clamps direct span children,
            which would stack the icon above the value. */}
        <div className="flex min-w-0 items-center gap-2 truncate">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SEMUA_LOKASI}>Semua lokasi</SelectItem>
        {lokasiOptions(values).map((l) => (
          <SelectItem key={l} value={l}>
            {l}
          </SelectItem>
        ))}
        <SelectItem value={TIADA_LOKASI}>Tiada lokasi</SelectItem>
      </SelectContent>
    </Select>
  );
}
