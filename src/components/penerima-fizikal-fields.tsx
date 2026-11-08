// Issue #12 — preferred language, weight and height of a care recipient,
// shared by the family's Daftar Warga Emas form and admin's add / edit forms.
// Renders bare grid cells; the page's 2-column grid lays them out.
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
  BAHASA_LAIN,
  BAHASA_OPTIONS,
  HAD_BAHASA,
  umur,
  type FizikalForm,
} from "@/lib/profil-penerima";

export function PenerimaFizikalFields({
  value,
  onChange,
}: {
  value: FizikalForm;
  onChange: (next: FizikalForm) => void;
}) {
  const set = (key: keyof FizikalForm, v: string) =>
    onChange({ ...value, [key]: v });

  return (
    <>
      <Field label="Bahasa Pilihan *">
        <Select value={value.bahasa} onValueChange={(v) => set("bahasa", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih bahasa" />
          </SelectTrigger>
          <SelectContent>
            {BAHASA_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
            <SelectItem value={BAHASA_LAIN}>{BAHASA_LAIN}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {value.bahasa === BAHASA_LAIN && (
        <Field label="Nyatakan Bahasa *">
          <Input
            value={value.bahasaLain}
            maxLength={HAD_BAHASA}
            onChange={(e) => set("bahasaLain", e.target.value)}
            placeholder="Cth: Hakka, Iban, Kadazandusun"
          />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-4">
        {/* step="any": the range and decimals are checked by semakFizikal, in Malay. */}
        <Field label="Berat (kg) *">
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="Cth: 58.5"
            value={value.berat}
            onChange={(e) => set("berat", e.target.value)}
          />
        </Field>
        <Field label="Tinggi (cm) *">
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            placeholder="Cth: 155"
            value={value.tinggi}
            onChange={(e) => set("tinggi", e.target.value)}
          />
        </Field>
      </div>
    </>
  );
}

/** "Umur: 74 tahun" under a birth date input. */
export function UmurHint({ birthDate }: { birthDate: string }) {
  if (!birthDate) return null;
  const n = umur(birthDate);
  return (
    <p
      className={`text-[11px] ${n == null ? "text-destructive" : "text-muted-foreground"}`}
    >
      {n == null ? "Tarikh lahir tidak sah." : `Umur: ${n} tahun`}
    </p>
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
