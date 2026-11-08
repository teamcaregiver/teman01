// Issue #12 — the booker's (penempah servis / anak) own details, shared by
// sign-up (daftar-anak) and Profil Saya. Each piece renders bare field blocks
// so the page decides the layout; headings span both columns of a 2-col grid.
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HAD_PENEMPAH, type MaklumatPenempah } from "@/lib/penempah";

type Props = {
  value: MaklumatPenempah;
  onChange: (next: MaklumatPenempah) => void;
  disabled?: boolean;
  /** Label size of the surrounding form, e.g. "text-xs" on Profil Saya. */
  labelClassName?: string;
};

export function PenempahIcField({
  value,
  onChange,
  disabled,
  labelClassName,
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="penempah-ic" className={labelClassName}>
        No. Kad Pengenalan *
      </Label>
      <Input
        id="penempah-ic"
        required
        maxLength={HAD_PENEMPAH.ic}
        placeholder="900101-14-5678"
        autoComplete="off"
        value={value.ic}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, ic: e.target.value })}
      />
      <p className="text-[11px] text-muted-foreground">
        MyKad, atau no. pasport bagi bukan warganegara.
      </p>
    </div>
  );
}

export function PenempahMajikanFields({
  value,
  onChange,
  disabled,
  labelClassName,
}: Props) {
  return (
    <>
      <SubHeading
        title="Majikan"
        hint="Pilihan — biarkan kosong jika tidak berkaitan."
      />
      <div className="space-y-1.5">
        <Label htmlFor="penempah-majikan" className={labelClassName}>
          Nama Majikan (Syarikat)
        </Label>
        <Input
          id="penempah-majikan"
          maxLength={HAD_PENEMPAH.namaMajikan}
          placeholder="Cth: Syarikat ABC Sdn. Bhd."
          autoComplete="organization"
          value={value.namaMajikan}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, namaMajikan: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="penempah-no-pekerja" className={labelClassName}>
          No. Pekerja (Staff ID)
        </Label>
        <Input
          id="penempah-no-pekerja"
          maxLength={HAD_PENEMPAH.noPekerja}
          placeholder="Cth: E-10234"
          autoComplete="off"
          value={value.noPekerja}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, noPekerja: e.target.value })}
        />
      </div>
    </>
  );
}

export function PenempahKecemasanFields({
  value,
  onChange,
  disabled,
  labelClassName,
}: Props) {
  return (
    <>
      <SubHeading
        title="Kontak Kecemasan"
        hint="Orang yang kami hubungi jika anda tidak dapat dihubungi."
      />
      <div className="space-y-1.5">
        <Label htmlFor="penempah-kecemasan-nama" className={labelClassName}>
          Nama *
        </Label>
        <Input
          id="penempah-kecemasan-nama"
          required
          maxLength={HAD_PENEMPAH.kecemasanNama}
          placeholder="Cth: Ahmad bin Ali (abang)"
          value={value.kecemasanNama}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...value, kecemasanNama: e.target.value })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="penempah-kecemasan-telefon" className={labelClassName}>
          No. Telefon *
        </Label>
        <Input
          id="penempah-kecemasan-telefon"
          required
          type="tel"
          maxLength={HAD_PENEMPAH.telefon}
          placeholder="013-9876543"
          value={value.kecemasanTelefon}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...value, kecemasanTelefon: e.target.value })
          }
        />
      </div>
    </>
  );
}

function SubHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="pt-2 sm:col-span-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {hint && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
