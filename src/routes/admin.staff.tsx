import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { users as initialUsers } from "@/lib/mock-data";
import type { User } from "@/lib/mock-data";
import { toast } from "sonner";
import { Check, Pencil, Plus, Search, X } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/staff")({
  component: StaffPage,
});

const EMPTY_ADD = { name: "", email: "", phone: "", password: "" };

function StaffPage() {
  const [list, setList] = useState<User[]>(initialUsers.filter((u) => u.role === "staff"));
  const [q, setQ] = useState("");
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", status: "" as User["status"] });

  const filtered = list.filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q)
  );

  const updateStatus = (id: string, status: User["status"]) => {
    setList(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    toast.success("Status staf dikemaskini");
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditForm({ name: u.name, phone: u.phone ?? "", status: u.status });
  };

  const handleAdd = () => {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      toast.error("Sila isi nama, emel dan kata laluan.");
      return;
    }
    const newStaff: User = {
      id: `u-staff-${Date.now()}`,
      name: addForm.name,
      email: addForm.email,
      phone: addForm.phone,
      role: "staff",
      status: "active",
    };
    setList(prev => [...prev, newStaff]);
    toast.success(`Staf ${addForm.name} berjaya ditambah`);
    setAddForm(EMPTY_ADD);
    setAddDialog(false);
  };

  const handleEdit = () => {
    if (!editTarget) return;
    if (!editForm.name.trim()) {
      toast.error("Nama tidak boleh kosong.");
      return;
    }
    setList(prev => prev.map(u => u.id === editTarget.id ? { ...u, name: editForm.name, phone: editForm.phone, status: editForm.status } : u));
    toast.success("Maklumat staf dikemaskini");
    setEditTarget(null);
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
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Tiada staf dijumpai.</p>
          )}
          {filtered.map((u, i) => (
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
                  <p className="truncate font-medium">{u.name}</p>
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
                    <Button size="sm" variant="outline" onClick={() => updateStatus(u.id, "active")}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Lulus
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(u.id, "rejected")}>
                      <X className="mr-1 h-3.5 w-3.5" /> Tolak
                    </Button>
                  </>
                )}
                {u.status === "active" && (
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(u.id, "inactive")}>Nyahaktif</Button>
                )}
                {u.status === "inactive" && (
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(u.id, "active")}>Aktifkan</Button>
                )}
              </div>
            </motion.div>
          ))}
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
            <Field label="Kata Laluan Sementara *">
              <Input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 aksara" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialog(false)}>Batal</Button>
            <Button onClick={handleAdd}>Tambah Staf</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staf Dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>Batal</Button>
            <Button onClick={handleEdit}>Simpan</Button>
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
