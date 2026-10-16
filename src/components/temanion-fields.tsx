import { useId } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LokasiSelect } from "@/components/lokasi-select";
import {
  BANGSA_OPTIONS,
  KEMAHIRAN_CADANGAN,
  UMUR_MAX,
  UMUR_MIN,
  WARGANEGARA_OPTIONS,
  parseKemahiran,
  tambahKemahiran,
} from "@/lib/temanion";
import type { ButiranTemanionForm } from "@/lib/temanion";

/**
 * The Temanion details admin records, in the order applications arrive in
 * (umur, telefon, warganegara, jantina, bangsa, lokasi, kemahiran). Name and
 * phone stay with the account fields of each dialog.
 */
export function TemanionFields({
  value,
  onChange,
}: {
  value: ButiranTemanionForm;
  onChange: (patch: Partial<ButiranTemanionForm>) => void;
}) {
  const id = useId();
  const chosen = parseKemahiran(value.kemahiran).map((s) => s.toLowerCase());
  const suggestions = KEMAHIRAN_CADANGAN.filter(
    (s) => !chosen.includes(s.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Umur" htmlFor={`${id}-umur`}>
          <Input
            id={`${id}-umur`}
            type="number"
            inputMode="numeric"
            min={UMUR_MIN}
            max={UMUR_MAX}
            step="1"
            value={value.umur}
            onChange={(e) => onChange({ umur: e.target.value })}
            placeholder="Cth: 53"
          />
        </Field>
        <Field label="Jantina" htmlFor={`${id}-jantina`}>
          <Select
            value={value.jantina || "none"}
            onValueChange={(v) =>
              onChange({ jantina: v === "none" ? "" : (v as "L" | "P") })
            }
          >
            <SelectTrigger id={`${id}-jantina`}>
              <SelectValue placeholder="Pilih jantina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Belum ditetapkan</SelectItem>
              <SelectItem value="L">Lelaki</SelectItem>
              <SelectItem value="P">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Warganegara" htmlFor={`${id}-warganegara`}>
          <Input
            id={`${id}-warganegara`}
            list={`${id}-warganegara-list`}
            value={value.warganegara}
            onChange={(e) => onChange({ warganegara: e.target.value })}
            placeholder="Cth: Malaysia"
          />
          <datalist id={`${id}-warganegara-list`}>
            {WARGANEGARA_OPTIONS.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </Field>
        <Field label="Bangsa" htmlFor={`${id}-bangsa`}>
          <Input
            id={`${id}-bangsa`}
            list={`${id}-bangsa-list`}
            value={value.bangsa}
            onChange={(e) => onChange({ bangsa: e.target.value })}
            placeholder="Cth: Melayu"
          />
          <datalist id={`${id}-bangsa-list`}>
            {BANGSA_OPTIONS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="Lokasi" htmlFor={`${id}-lokasi`}>
        <LokasiSelect
          id={`${id}-lokasi`}
          value={value.lokasi}
          onChange={(lokasi) => onChange({ lokasi })}
        />
      </Field>
      <Field label="Alamat" htmlFor={`${id}-alamat`}>
        <Textarea
          id={`${id}-alamat`}
          rows={2}
          value={value.alamat}
          onChange={(e) => onChange({ alamat: e.target.value })}
          placeholder="Cth: Setapak Indah, Kuala Lumpur"
        />
      </Field>

      <Field label="Kemahiran" htmlFor={`${id}-kemahiran`}>
        <Input
          id={`${id}-kemahiran`}
          value={value.kemahiran}
          onChange={(e) => onChange({ kemahiran: e.target.value })}
          placeholder="Cth: Penjagaan Warga Emas, Pertolongan Cemas"
        />
        <p className="text-[11px] text-muted-foreground">
          Pisahkan setiap kemahiran dengan koma.
        </p>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  onChange({ kemahiran: tambahKemahiran(value.kemahiran, s) })
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        )}
      </Field>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
