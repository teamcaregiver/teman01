import { BookOpenCheck, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CartaBristol,
  CartaWarnaUrin,
  FaktorRisikoJatuh,
  JadualPusingan,
  SkalaKesakitan,
  SkalaTingkahLaku,
} from "@/components/pemantauan-rujukan";
import {
  BUKU3_PANDUAN,
  BUKU3_PENGENALAN,
  BUKU3_PERANAN,
  BUKU3_PROFIL,
  BUKU3_SASARAN,
  BUKU3_TAJUK,
  BUKU3_UNIT,
  KATEGORI_UBAT,
  NOTA_UBAT,
  RUJUKAN_VITAL,
  RUTIN_HARIAN,
  WAKTU_DOS,
  WAKTU_MAKAN_BUKU3,
} from "@/lib/buku3";
import type { Buku3Unit, Buku3UnitId } from "@/lib/buku3";
import { matchesSearch } from "@/lib/search";

type Bahagian = {
  id: string;
  tajuk: string;
  /** Text searched by the page's search box. */
  teks: string[];
  isi: React.ReactNode;
};

/** Buku 3 — the monitoring-table manual, as a reference for families. */
export function Buku3({ query = "" }: { query?: string }) {
  const bahagian = senaraiBahagian().filter((b) =>
    matchesSearch([b.tajuk, ...b.teks], query),
  );

  return (
    <div className="space-y-3">
      <Card className="border-border/60 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-sage text-sage-foreground">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Buku 3
            </p>
            <h2 className="font-display text-lg font-bold leading-tight">
              {BUKU3_TAJUK}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {BUKU3_PENGENALAN}
            </p>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-teal/10 p-2.5 text-[11px]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
          Dalam sistem ini, Temanion merekod jadual pemantauan secara digital.
          Masa dan pengesahan (nama Temanion) direkod secara automatik, dan
          rekod boleh dilihat di halaman Progres.
        </p>
      </Card>

      {bahagian.length === 0 ? (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">
          Tiada bahagian Buku 3 sepadan dengan carian.
        </Card>
      ) : (
        <Card className="border-border/60 px-4 py-1">
          <Accordion type="multiple">
            {bahagian.map((b) => (
              <AccordionItem key={b.id} value={b.id} className="last:border-0">
                <AccordionTrigger className="font-display">
                  {b.tajuk}
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {b.isi}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}
    </div>
  );
}

function senaraiBahagian(): Bahagian[] {
  return [
    {
      id: "peranan",
      tajuk: "Peranan Utama Manual",
      teks: BUKU3_PERANAN.flatMap((p) => [p.tajuk, p.huraian]),
      isi: (
        <ul className="space-y-2">
          {BUKU3_PERANAN.map((p) => (
            <li key={p.tajuk} className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-semibold">{p.tajuk}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {p.huraian}
              </p>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "sasaran",
      tajuk: "Sasaran Pengguna Manual",
      teks: BUKU3_SASARAN,
      isi: (
        <>
          <Senarai item={BUKU3_SASARAN} />
          <p className="text-xs text-muted-foreground">
            Manual ini dapat membantu memastikan penjagaan pesakit dilaksanakan
            secara lebih teratur, profesional dan berfokus kepada kesejahteraan
            pesakit serta caregiver.
          </p>
        </>
      ),
    },
    {
      id: "profil",
      tajuk: "Profil dan Maklumat Pesakit",
      teks: [...BUKU3_PROFIL.arahan, ...BUKU3_PROFIL.baris.flat()],
      isi: (
        <>
          <Arahan item={BUKU3_PROFIL.arahan} />
          <Jadual
            lajur={["Perkara", "Catatan tambahan"]}
            baris={BUKU3_PROFIL.baris.map(([a, b]) => [a, b || "—"])}
          />
        </>
      ),
    },
    {
      id: "panduan",
      tajuk: "Panduan Penggunaan Manual 3",
      teks: BUKU3_PANDUAN,
      isi: <Senarai item={BUKU3_PANDUAN} bernombor />,
    },
    ...BUKU3_UNIT.map((u) => ({
      id: u.id,
      tajuk: `Unit ${u.unit}: ${u.tajuk}`,
      teks: [...u.arahan, ...(TEKS_RUJUKAN[u.id] ?? [])],
      isi: <UnitIsi unit={u} />,
    })),
  ];
}

// Words in each unit's reference block, so the search box finds them too.
const TEKS_RUJUKAN: Partial<Record<Buku3UnitId, string[]>> = {
  rutin: RUTIN_HARIAN,
  vital: RUJUKAN_VITAL.map((v) => v.parameter),
  ubat: [...KATEGORI_UBAT, ...NOTA_UBAT],
  pemakanan: WAKTU_MAKAN_BUKU3,
  perkumuhan: ["Bristol", "najis", "air kencing", "urin", "muntah"],
  tingkahLaku: ["mood", "interaksi", "emosi"],
  posisi: ["clock turn", "luka tekanan"],
  kesakitan: ["Wong-Baker", "pain score"],
  risikoJatuh: ["jatuh", "Morse Fall Scale"],
};

function UnitIsi({ unit: u }: { unit: Buku3Unit }) {
  return (
    <>
      <Arahan item={u.arahan} />
      {u.id === "rutin" && (
        <Blok tajuk="Cadangan rutin harian">
          <Senarai item={RUTIN_HARIAN} bernombor />
        </Blok>
      )}
      {u.id === "vital" && (
        <Blok tajuk="Rujukan bacaan & interpretasi tanda vital">
          <Jadual
            lajur={["Parameter", "Normal", "Amaran", "Bahaya", "Tindakan"]}
            baris={RUJUKAN_VITAL.map((v) => [
              v.parameter,
              v.normal,
              v.amaran,
              v.bahaya,
              v.tindakan,
            ])}
          />
        </Blok>
      )}
      {u.id === "ubat" && (
        <>
          <Blok tajuk="Kategori ubat">
            <Senarai item={KATEGORI_UBAT} />
            <ul className="space-y-1 text-[11px] italic text-muted-foreground">
              {NOTA_UBAT.map((n) => (
                <li key={n}>* {n}</li>
              ))}
            </ul>
          </Blok>
          <Blok tajuk="Waktu pengambilan ubat yang betul">
            <Jadual
              lajur={["Dos", "Waktu"]}
              baris={WAKTU_DOS.map((w) => [w.dos, w.waktu])}
            />
          </Blok>
        </>
      )}
      {u.id === "pemakanan" && (
        <Blok tajuk="Waktu makan dalam jadual">
          <Senarai item={WAKTU_MAKAN_BUKU3} />
        </Blok>
      )}
      {u.id === "perkumuhan" && (
        <>
          <Blok tajuk="Carta najis (Bristol Stool Chart)">
            <CartaBristol />
          </Blok>
          <Blok tajuk="Carta warna urin">
            <CartaWarnaUrin />
          </Blok>
        </>
      )}
      {u.id === "tingkahLaku" && (
        <Blok tajuk="Indikator pemerhatian">
          <SkalaTingkahLaku />
        </Blok>
      )}
      {u.id === "posisi" && (
        <Blok tajuk="Carta penukaran posisi berkala (Clock Turn Schedule)">
          <JadualPusingan />
        </Blok>
      )}
      {u.id === "kesakitan" && (
        <Blok tajuk="Wong-Baker FACES Pain Rating Scale">
          <SkalaKesakitan />
        </Blok>
      )}
      {u.id === "risikoJatuh" && (
        <Blok tajuk="Faktor risiko">
          <FaktorRisikoJatuh />
        </Blok>
      )}
      {u.sumber && (
        <p className="text-[11px] text-muted-foreground">Sumber: {u.sumber}</p>
      )}
    </>
  );
}

function Arahan({ item }: { item: string[] }) {
  return (
    <Blok tajuk="Arahan am">
      <Senarai item={item} bernombor />
    </Blok>
  );
}

function Blok({
  tajuk,
  children,
}: {
  tajuk: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {tajuk}
      </p>
      {children}
    </div>
  );
}

function Senarai({ item, bernombor }: { item: string[]; bernombor?: boolean }) {
  const Tag = bernombor ? "ol" : "ul";
  return (
    <Tag
      className={`space-y-1 pl-5 text-xs leading-relaxed ${bernombor ? "list-decimal" : "list-disc"}`}
    >
      {item.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </Tag>
  );
}

function Jadual({ lajur, baris }: { lajur: string[]; baris: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            {lajur.map((l) => (
              <th key={l} className="whitespace-nowrap px-3 py-2 font-semibold">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.map((r) => (
            <tr
              key={r.join("|")}
              className="border-b border-border/50 last:border-0"
            >
              {r.map((c, i) => (
                <td
                  key={i}
                  className={i === 0 ? "px-3 py-2 font-medium" : "px-3 py-2"}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
