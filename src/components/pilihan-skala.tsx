import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export type PilihanItem<T extends string | number> = {
  value: T;
  label: string;
  hint?: string;
  /** Colour swatch shown above the label (urine chart). */
  swatch?: string;
  /** Large symbol shown above the label (pain faces). */
  simbol?: string;
};

/**
 * One choice from a Manual 3 scale, as large tappable cards. A Radix radio
 * group underneath, so arrow keys move between options and screen readers
 * announce it as a group.
 */
export function PilihanSkala<T extends string | number>({
  label,
  value,
  onChange,
  options,
  className,
  onClear,
}: {
  label: string;
  value: T | undefined;
  onChange: (value: T) => void;
  options: PilihanItem<T>[];
  /** Grid classes, e.g. "grid-cols-4 sm:grid-cols-8". */
  className?: string;
  /** Shows a "Kosongkan" button for optional questions. */
  onClear?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">{label}</p>
        {onClear && value !== undefined && (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Kosongkan
          </button>
        )}
      </div>
      <RadioGroupPrimitive.Root
        aria-label={label}
        value={value === undefined ? "" : String(value)}
        onValueChange={(v) => {
          const o = options.find((x) => String(x.value) === v);
          if (o) onChange(o.value);
        }}
        className={cn("grid gap-2", className)}
      >
        {options.map((o) => {
          const selected =
            value !== undefined && String(value) === String(o.value);
          return (
            <RadioGroupPrimitive.Item
              key={String(o.value)}
              value={String(o.value)}
              className={cn(
                "flex h-full cursor-pointer flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/40",
              )}
            >
              {o.swatch && (
                <span
                  className="h-6 w-full rounded-md ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: o.swatch }}
                  aria-hidden
                />
              )}
              {o.simbol && (
                <span className="text-2xl leading-none" aria-hidden>
                  {o.simbol}
                </span>
              )}
              <span className="text-xs font-semibold leading-tight">
                {o.label}
              </span>
              {o.hint && (
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {o.hint}
                </span>
              )}
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>
    </div>
  );
}
