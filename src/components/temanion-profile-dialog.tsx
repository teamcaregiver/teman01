import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  CalendarDays,
  HeartHandshake,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingStatusPill } from "@/components/booking-status-pill";
import { useBookings, useGetServiceType, useParents } from "@/lib/data";
import { OPEN_BOOKING_STATUSES } from "@/lib/db";
import { JANTINA_LABEL, umurDariTahunLahir } from "@/lib/temanion";
import type { StaffMember } from "@/lib/temanion";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<StaffMember["status"], string> = {
  active: "Aktif",
  pending: "Menunggu",
  rejected: "Ditolak",
  inactive: "Tidak Aktif",
};

/** Everything admin knows about one Temanion, opened by clicking their name. */
export function TemanionProfileDialog({
  member,
  onOpenChange,
  onEdit,
}: {
  member: StaffMember | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (member: StaffMember) => void;
}) {
  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {member && <ProfileBody member={member} onEdit={onEdit} />}
      </DialogContent>
    </Dialog>
  );
}

function ProfileBody({
  member: m,
  onEdit,
}: {
  member: StaffMember;
  onEdit: (member: StaffMember) => void;
}) {
  const parents = useParents();
  const bookings = useBookings();
  const getServiceType = useGetServiceType();

  const umur = umurDariTahunLahir(m.tahunLahir);
  const isStaff = m.role === "staff";
  const dijaga = parents.filter((p) => p.staffId === m.id);
  const servisAktif = bookings
    .filter(
      (b) => b.caregiverId === m.id && OPEN_BOOKING_STATUSES.includes(b.status),
    )
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const parentName = (id?: string) =>
    parents.find((p) => p.id === id)?.fullName;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
              m.jantina === "L"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
                : m.jantina === "P"
                  ? "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300"
                  : "gradient-teal text-teal-foreground",
            )}
          >
            <UserRound className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 text-left">
            <DialogTitle className="truncate font-display text-lg">
              {m.name}
            </DialogTitle>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="bg-teal/20 text-teal-foreground"
              >
                {isStaff ? "Temanion" : "Admin"}
              </Badge>
              <Badge variant="outline">{STATUS_LABEL[m.status]}</Badge>
            </div>
          </div>
        </div>
        <DialogDescription className="sr-only">
          Profil penuh {m.name}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Section title="Maklumat Peribadi">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Item
              label="Umur"
              value={umur != null ? `${umur} tahun` : undefined}
            />
            <Item
              label="Jantina"
              value={m.jantina ? JANTINA_LABEL[m.jantina] : undefined}
            />
            <Item label="Warganegara" value={m.warganegara} />
            <Item label="Bangsa" value={m.bangsa} />
            <Item
              label="No. Telefon"
              icon={<Phone className="h-3.5 w-3.5" />}
              value={m.phone}
              href={m.phone ? `tel:${m.phone.replace(/\s/g, "")}` : undefined}
            />
            <Item
              label="Emel"
              icon={<Mail className="h-3.5 w-3.5" />}
              value={m.email}
              href={`mailto:${m.email}`}
            />
            <Item
              label="Lokasi"
              icon={<MapPin className="h-3.5 w-3.5" />}
              value={m.lokasi}
            />
            <Item
              label="Tarikh Daftar"
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              value={
                m.createdAt
                  ? format(new Date(m.createdAt), "dd MMM yyyy")
                  : undefined
              }
            />
            <Item label="Alamat" value={m.alamat} full />
          </dl>
        </Section>

        {isStaff && (
          <>
            <Section
              title="Kemahiran"
              icon={<Sparkles className="h-3.5 w-3.5" />}
            >
              {m.kemahiran.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {m.kemahiran.map((k) => (
                    <Badge
                      key={k}
                      variant="secondary"
                      className="bg-sage/20 text-sage-foreground"
                    >
                      {k}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum direkodkan.
                </p>
              )}
            </Section>

            <Section title="Profil Temanion">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Item label="Kepakaran" value={m.specialization} full />
                <Item
                  label="Pengalaman"
                  value={
                    m.experienceYears != null
                      ? `${m.experienceYears} tahun`
                      : undefined
                  }
                />
                <Item
                  label="Penilaian"
                  icon={<Star className="h-3.5 w-3.5" />}
                  value={m.rating != null ? m.rating.toFixed(1) : undefined}
                />
                <Item label="Catatan" value={m.notes} full />
              </dl>
            </Section>

            <Section
              title="Tugasan"
              icon={<HeartHandshake className="h-3.5 w-3.5" />}
            >
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Penerima servis dijaga ({dijaga.length})
                  </p>
                  {dijaga.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {dijaga.map((p) => (
                        <Link
                          key={p.id}
                          to="/admin/warga-emas/$parentId"
                          params={{ parentId: p.id }}
                          className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium hover:bg-accent"
                        >
                          {p.fullName}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-0.5 text-muted-foreground">Tiada.</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Servis aktif ({servisAktif.length})
                  </p>
                  {servisAktif.length > 0 ? (
                    <ul className="mt-1 space-y-1.5">
                      {servisAktif.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs"
                        >
                          <span className="min-w-0 truncate">
                            {b.date
                              ? format(
                                  new Date(`${b.date}T${b.time || "00:00"}`),
                                  "dd MMM yyyy",
                                )
                              : "—"}
                            {" · "}
                            {getServiceType(b.serviceTypeId)?.name ?? "Servis"}
                            {parentName(b.parentId)
                              ? ` · ${parentName(b.parentId)}`
                              : ""}
                          </span>
                          <BookingStatusPill status={b.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-0.5 text-muted-foreground">Tiada.</p>
                  )}
                </div>
              </div>
            </Section>
          </>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onEdit(m)}>
          <Pencil className="mr-1 h-3.5 w-3.5" /> Edit Maklumat
        </Button>
      </DialogFooter>
    </>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {title}
      </p>
      {children}
    </div>
  );
}

function Item({
  label,
  value,
  icon,
  href,
  full,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  href?: string;
  full?: boolean;
}) {
  const text = value?.trim() ? value : "—";
  return (
    <div className={full ? "col-span-2" : undefined}>
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 flex items-start gap-1.5 text-sm font-medium">
        {icon && text !== "—" && (
          <span className="mt-0.5 text-muted-foreground">{icon}</span>
        )}
        {href && text !== "—" ? (
          <a href={href} className="break-all hover:underline">
            {text}
          </a>
        ) : (
          <span className="whitespace-pre-wrap break-words">{text}</span>
        )}
      </dd>
    </div>
  );
}
