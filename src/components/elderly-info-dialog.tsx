import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Parent } from "@/lib/mock-data";
import { GenderAvatar } from "@/components/gender-avatar";
import { differenceInYears } from "date-fns";
import { Info } from "lucide-react";

function ageFromBirth(birthDate?: string): string {
  if (!birthDate) return "—";
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return "—";
  return `${differenceInYears(new Date(), d)} tahun`;
}

// Reusable "Info" button that opens a modal with the elderly person's care
// profile. Keeps the main staff pages clean — details live behind a tap.
// Staff-only: IC, birth date, blood type, insurance number and dietary
// restrictions are left out on purpose (admin sees them on the resident page).
export function ElderlyInfoDialog({
  parent,
  trigger,
}: {
  parent: Parent;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-4 w-4" /> Info
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <GenderAvatar gender={parent.gender} />
            <div className="min-w-0">
              <DialogTitle className="font-display">
                {parent.fullName}
              </DialogTitle>
              <DialogDescription>
                {parent.gender === "L" ? "Lelaki" : "Perempuan"}
                {parent.relationship ? ` · ${parent.relationship}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Personal */}
          <Section title="Maklumat Peribadi">
            <Item label="Umur" value={ageFromBirth(parent.birthDate)} />
            <Item label="No. Telefon" value={parent.phone} />
            <Item label="Status Mobiliti" value={parent.statusMobiliti} />
            <Item label="Status Kognitif" value={parent.statusKognitif} />
            <div className="col-span-2">
              <Item label="Alamat" value={parent.address} />
            </div>
          </Section>

          {/* Medical */}
          <Section title="Maklumat Perubatan">
            <div className="col-span-2">
              <Item label="Kondisi Perubatan" value={parent.medicalCondition} />
            </div>
            <div className="col-span-2">
              <Item label="Senarai Ubat" value={parent.medication} />
            </div>
            <div className="col-span-2">
              <Item label="Alahan" value={parent.alahan} />
            </div>
            <Item label="Doktor" value={parent.namaDoktor} />
            <Item label="Tel Doktor" value={parent.telDoktor} />
            <div className="col-span-2">
              <Item label="Hospital Rujukan" value={parent.hospitalRujukan} />
            </div>
          </Section>

          {/* Emergency */}
          <Section title="Kecemasan">
            <div className="col-span-2">
              <Item label="Kontak Kecemasan" value={parent.emergencyContact} />
            </div>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <dl className="grid grid-cols-2 gap-3 text-sm">{children}</dl>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}
