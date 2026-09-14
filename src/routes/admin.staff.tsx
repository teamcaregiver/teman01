import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { User } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase/client";
import { adminCreateUser } from "@/lib/admin-users";
import { qk } from "@/lib/data";
import { toast } from "sonner";
import { Check, Pencil, Plus, Search, X } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/staff")({
  component: StaffPage,
});

/** Roles this page manages. `anak` accounts are not staff and stay out of it. */
type ManagedRole = "admin" | "staff";

const ROLE_OPTIONS: { value: ManagedRole; label: string }[] = [
  { value: "staff", label: "Staf" },
  { value: "admin", label: "Admin" },
];

const roleTone: Record<ManagedRole, string> = {
  admin: "bg-lavender/25 text-lavender-foreground",
  staff: "bg-teal/20 text-teal-foreground",
};

/** Mirrors the DB trigger message in migration 0006 — kept identical on purpose. */
const LAST_ADMIN_MSG =
  "Sekurang-kurangnya satu akaun Admin aktif mesti kekal dalam sistem.";

const EMPTY_ADD = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "staff" as ManagedRole,
};

/** A staff/admin account plus the caregiver details shown to families. */
type StaffMember = User & {
  specialization?: string;
  experienceYears?: number;
  rating?: number;
  notes?: string;
};

async function fetchStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,email,role,status,phone,specialization,experience_years,rating,notes,created_at")
    .in("role", ["admin", "staff"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    status: p.status,
    phone: p.phone ?? undefined,
    specialization: p.specialization ?? undefined,
    experienceYears: p.experience_years ?? undefined,
    rating: p.rating ?? undefined,
    notes: p.notes ?? undefined,
  }));
}

/** Empty input -> null; otherwise a number, or NaN when unparseable. */
const toNumberOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

function StaffPage() {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  // Staff accounts are the caregivers, so their cards refresh too.
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["staff"] });
    qc.invalidateQueries({ queryKey: qk.caregivers });
  };

  const [q, setQ] = useState("");
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "staff" as ManagedRole,
    status: "" as User["status"],
    specialization: "",
    experienceYears: "",
    rating: "",
    notes: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const needle = q.trim().toLowerCase();
  const filtered = list.filter(
    (u) =>
      u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle),
  );

  // Frontend half of the "keep one active admin" rule. The DB trigger enforces
  // the same thing, so a stale list here can never actually bypass it.
  const activeAdminCount = list.filter(
    (u) => u.role === "admin" && u.status === "active",
  ).length;
  const isLastActiveAdmin = (u: User) =>
    u.role === "admin" && u.status === "active" && activeAdminCount <= 1;

  const updateStatus = async (u: User, status: User["status"]) => {
    if (status !== "active" && isLastActiveAdmin(u)) {
      toast.error(LAST_ADMIN_MSG);
      return;
    }
    const { error } = await supabase.from("profiles").update({ status }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success("Status staf dikemaskini");
    refresh();
  };

  const openEdit = (u: StaffMember) => {
    setEditTarget(u);
    setEditForm({
      name: u.name,
      phone: u.phone ?? "",
      role: (u.role === "admin" ? "admin" : "staff") as ManagedRole,
      status: u.status,
      specialization: u.specialization ?? "",
      experienceYears: u.experienceYears != null ? String(u.experienceYears) : "",
      rating: u.rating != null ? String(u.rating) : "",
      notes: u.notes ?? "",
    });
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      toast.error("Sila isi nama, emel dan kata laluan.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(addForm.email.trim())) {
      toast.error("Format emel tidak sah.");
      return;
    }
    if (addForm.password.length < 6) {
      toast.error("Kata laluan mesti sekurang-kurangnya 6 aksara.");
      return;
    }
    if (addForm.role !== "admin" && addForm.role !== "staff") {
      toast.error("Sila pilih peranan.");
      return;
    }
    setSaving(true);
    try {
      await adminCreateUser({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        role: addForm.role,
      });
      const roleLabel = addForm.role === "admin" ? "Admin" : "Staf";
      toast.success(`${roleLabel} ${addForm.name.trim()} berjaya ditambah`);
      setAddForm(EMPTY_ADD);
      setAddDialog(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menambah staf.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }
    const losesAdmin = editForm.role !== "admin" || editForm.status !== "active";
    if (losesAdmin && isLastActiveAdmin(editTarget)) {
      toast.error(LAST_ADMIN_MSG);
      return;
    }
    // Same bounds as the checks on profiles in migration 0009.
    const experienceYears = toNumberOrNull(editForm.experienceYears);
    const rating = toNumberOrNull(editForm.rating);
    if (experienceYears !== null && (!Number.isInteger(experienceYears) || experienceYears < 0)) {
      toast.error("Tahun pengalaman mesti nombor bulat dan tidak negatif.");
      return;
    }
    if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
      toast.error("Penilaian mesti antara 0 dan 5.");
      return;
    }
    setEditSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        status: editForm.status,
        specialization: editForm.specialization.trim() || null,
        experience_years: experienceYears,
        rating,
        notes: editForm.notes.trim() || null,
      })
      .eq("id", editTarget.id);
    setEditSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Maklumat staf dikemaskini");
    setEditTarget(null);
    refresh();
  };

  const tone: Record<User["status"], string> = {
    active: "bg-status-normal/15 text-status-normal",
    pending: "bg-status-attention/15 text-status-attention",
    rejected: "bg-status-critical/15 text-status-critical",
    inactive: "bg-muted text-muted-foreground",
  };
  const label: Record<User["status"], string> = {
    active: "Aktif",
    pending: "Menunggu",
    rejected: "Ditolak",
    inactive: "Tidak Aktif",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Pengurusan Staf</h1>
          <p className="text-sm text-muted-foreground">Lulus permohonan & urus akaun penjaga.</p>
        </div>
        <Button onClick={() => { setAddForm(EMPTY_ADD); setAddDialog(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Staf
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Cari nama atau emel..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="border-border/60 p-0">
        <div className="divide-y divide-border">
          {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Memuatkan...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Tiada staf dijumpai.</p>
          )}
          {filtered.map((u, i) => {
            const role: ManagedRole = u.role === "admin" ? "admin" : "staff";
            const lastAdmin = isLastActiveAdmin(u);
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full gradient-teal font-display text-sm font-bold text-teal-foreground">
                    {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 truncate font-medium">{u.name}</p>
                      <Badge variant="outline" className={roleTone[role]}>
                        {role === "admin" ? "Admin" : "Staf"}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{u.email} · {u.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={tone[u.status]}>{label[u.status]}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  {u.status === "pending" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(u, "active")}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Lulus
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(u, "rejected")}>
                        <X className="mr-1 h-3.5 w-3.5" /> Tolak
                      </Button>
                    </>
                  )}
                  {u.status === "active" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      title={lastAdmin ? LAST_ADMIN_MSG : undefined}
                      onClick={() => updateStatus(u, "inactive")}
                    >
                      Nyahaktif
                    </Button>
                  )}
                  {u.status === "inactive" && (
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(u, "active")}>Aktifkan</Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Tambah Staf Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Staf Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nama Penuh *">
              <Input value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="Cth: Nurul Aisyah" />
            </Field>
            <Field label="Emel *">
              <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="nurul@care.my" />
            </Field>
            <Field label="No. Telefon">
              <Input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="012-3456789" />
            </Field>
            <Field label="Peranan *">
              <Select
                value={addForm.role}
                onValueChange={v => setAddForm(f => ({ ...f, role: v as ManagedRole }))}
              >
                <SelectTrigger><SelectValue placeholder="Pilih peranan" /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Admin boleh urus semua akaun & tetapan sistem. Staf hanya urus penjagaan.
              </p>
            </Field>
            <Field label="Kata Laluan Sementara *">
              <PasswordInput value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 aksara" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialog(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? "Menyimpan..." : "Tambah Staf"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staf Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Maklumat Staf</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nama Penuh *">
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="No. Telefon">
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </Field>
            <Field label="Peranan *">
              <Select
                value={editForm.role}
                onValueChange={v => setEditForm(f => ({ ...f, role: v as ManagedRole }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status Akaun">
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as User["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {editForm.role === "staff" && (
              <div className="space-y-4 rounded-lg border border-border/60 p-3">
                <div>
                  <p className="text-xs font-semibold">Profil Caregiver</p>
                  <p className="text-[11px] text-muted-foreground">
                    Dipaparkan kepada keluarga apabila staf ini ditugaskan ke tempahan.
                  </p>
                </div>
                <Field label="Kepakaran">
                  <Input
                    value={editForm.specialization}
                    onChange={e => setEditForm(f => ({ ...f, specialization: e.target.value }))}
                    placeholder="Cth: Penjagaan Warga Emas & Pemantauan Vital"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tahun Pengalaman">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={editForm.experienceYears}
                      onChange={e => setEditForm(f => ({ ...f, experienceYears: e.target.value }))}
                    />
                  </Field>
                  <Field label="Penilaian (0–5)">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="5"
                      step="0.1"
                      value={editForm.rating}
                      onChange={e => setEditForm(f => ({ ...f, rating: e.target.value }))}
                    />
                  </Field>
                </div>
                <Field label="Catatan">
                  <Textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </Field>
              </div>
            )}
            {editTarget && isLastActiveAdmin(editTarget) && (
              <p className="rounded-lg bg-status-attention/10 p-2.5 text-[11px] text-muted-foreground">
                Ini satu-satunya Admin aktif. {LAST_ADMIN_MSG}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)} disabled={editSaving}>Batal</Button>
            <Button onClick={handleEdit} disabled={editSaving}>{editSaving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
