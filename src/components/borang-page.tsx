// Borang board — one page for admin and staff, rendered inside each role
// layout. Everyone on the team sees every link; staff manage the links they
// posted, admins manage all of them and can restore deleted ones.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  ClipboardPen,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { useAuth } from "@/lib/auth-store";
import { qk, useFormLinksQuery, useUsers } from "@/lib/data";
import {
  FORM_LINK_DESCRIPTION_MAX,
  FORM_LINK_TITLE_MAX,
  canManageFormLink,
  checkFormLink,
  createFormLink,
  deleteFormLink,
  formLinkHost,
  restoreFormLink,
  setFormLinkArchived,
  updateFormLink,
  type FormLinkInput,
} from "@/lib/form-links";
import type { FormLink } from "@/lib/mock-data";

type Tab = "active" | "archived" | "deleted";

const EMPTY_FORM: FormLinkInput = { title: "", url: "", description: "" };

const byNewest = (key: "archivedAt" | "deletedAt") => (a: FormLink, b: FormLink) =>
  +new Date(b[key] ?? 0) - +new Date(a[key] ?? 0);

export function BorangPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const query = useFormLinksQuery();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; link?: FormLink }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<FormLink | null>(null);

  const all = query.data ?? [];
  const lists: Record<Tab, FormLink[]> = {
    active: all.filter((l) => !l.deletedAt && !l.archivedAt),
    archived: all.filter((l) => !l.deletedAt && l.archivedAt).sort(byNewest("archivedAt")),
    deleted: all.filter((l) => l.deletedAt).sort(byNewest("deletedAt")),
  };
  // Staff never receive deleted rows, but keep the tab admin-only regardless.
  const current: Tab = tab === "deleted" && !isAdmin ? "active" : tab;

  const needle = q.trim().toLowerCase();
  const list = lists[current].filter((l) =>
    [l.title, l.description, formLinkHost(l.url), l.createdByName].some((s) =>
      s.toLowerCase().includes(needle),
    ),
  );

  /** Run a write, refresh the board, and report the outcome. */
  const run = async (id: string, action: () => Promise<void>, success: string) => {
    setBusyId(id);
    try {
      await action();
      await qc.invalidateQueries({ queryKey: qk.formLinks });
      toast.success(success);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tindakan gagal. Sila cuba lagi.");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async (link: FormLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("Pautan disalin");
    } catch {
      toast.error("Gagal menyalin pautan.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await run(deleteTarget.id, () => deleteFormLink(deleteTarget.id), "Pautan dipadam");
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Borang</h1>
          <p className="text-sm text-muted-foreground">
            Simpan dan kongsi pautan borang untuk rujukan seluruh pasukan.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Pautan
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Tapis senarai borang" className="flex flex-wrap gap-1.5">
          <TabButton active={current === "active"} onClick={() => setTab("active")}>
            Aktif <span className="ml-1 opacity-70">({lists.active.length})</span>
          </TabButton>
          <TabButton active={current === "archived"} onClick={() => setTab("archived")}>
            Arkib <span className="ml-1 opacity-70">({lists.archived.length})</span>
          </TabButton>
          {isAdmin && (
            <TabButton active={current === "deleted"} onClick={() => setTab("deleted")}>
              Dipadam <span className="ml-1 opacity-70">({lists.deleted.length})</span>
            </TabButton>
          )}
        </div>

        <div className="relative w-full max-w-sm sm:w-auto sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari tajuk, laman atau penerangan..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {query.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <Card className="border-border/60 p-10 text-center">
          <p className="text-sm font-medium">Gagal memuatkan senarai borang</p>
          <p className="mt-1 text-xs text-muted-foreground">{(query.error as Error).message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void query.refetch()}>
            Cuba lagi
          </Button>
        </Card>
      ) : list.length === 0 ? (
        <EmptyState
          tab={current}
          searching={needle.length > 0}
          onAdd={() => setDialog({ open: true })}
        />
      ) : (
        <StaggerList key={current}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((link) => {
              const busy = busyId === link.id;
              const canManage = canManageFormLink(link, user);
              return (
                <StaggerItem key={link.id}>
                  <Card className="flex h-full flex-col border-border/60 p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-lavender text-lavender-foreground">
                        <ClipboardPen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-display font-semibold leading-snug">
                          {link.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground" title={link.url}>
                          {formLinkHost(link.url)}
                        </p>
                      </div>
                    </div>

                    {link.description && (
                      <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    )}

                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <p>
                        Ditambah oleh{" "}
                        <span className="font-medium text-foreground">
                          {user && link.createdBy === user.id ? "anda" : link.createdByName || "—"}
                        </span>{" "}
                        · {format(new Date(link.createdAt), "dd MMM yyyy")}
                      </p>
                      {current === "archived" && link.archivedAt && (
                        <p>Diarkibkan {format(new Date(link.archivedAt), "dd MMM yyyy")}</p>
                      )}
                      {current === "deleted" && link.deletedAt && (
                        <p>
                          Dipadam {format(new Date(link.deletedAt), "dd MMM yyyy, HH:mm")}
                          <DeletedBy userId={link.deletedBy} />
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-1 pt-4">
                      {current === "deleted" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() =>
                            void run(link.id, () => restoreFormLink(link.id), "Pautan dipulihkan")
                          }
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                          {busy ? "Memulihkan..." : "Pulihkan"}
                        </Button>
                      ) : (
                        <Button size="sm" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1 h-3.5 w-3.5" /> Buka Borang
                          </a>
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Salin pautan"
                        onClick={() => void copyLink(link)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {canManage && current !== "deleted" && (
                        <div className="ml-auto flex gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Edit"
                            disabled={busy}
                            onClick={() => setDialog({ open: true, link })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {current === "archived" ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Nyaharkib"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  link.id,
                                  () => setFormLinkArchived(link.id, false),
                                  "Pautan dikembalikan ke senarai aktif",
                                )
                              }
                            >
                              <ArchiveRestore className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Arkib"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  link.id,
                                  () => setFormLinkArchived(link.id, true),
                                  "Pautan diarkibkan",
                                )
                              }
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Padam"
                            disabled={busy}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(link)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </div>
        </StaggerList>
      )}

      <LinkDialog
        open={dialog.open}
        link={dialog.link}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSave={async (input) => {
          const editing = dialog.link;
          const ok = editing
            ? await run(editing.id, () => updateFormLink(editing.id, input), "Pautan dikemas kini")
            : await run("new", () => createFormLink(input), "Pautan berjaya ditambah");
          if (ok) setDialog((d) => ({ ...d, open: false }));
        }}
        saving={busyId === (dialog.link?.id ?? "new")}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam pautan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}"{" "}
              {isAdmin
                ? "akan dipindahkan ke tab Dipadam. Anda boleh memulihkannya bila-bila masa."
                : "akan dibuang daripada senarai Borang. Hanya admin boleh memulihkannya semula."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={busyId === deleteTarget?.id}
              onClick={(e) => {
                // Keep the dialog open until the delete finishes.
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busyId === deleteTarget?.id ? "Memadam..." : "Ya, Padam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** " oleh <name>" for a deleted link. Only mounted on the admin-only tab. */
function DeletedBy({ userId }: { userId?: string }) {
  const users = useUsers();
  const name = users.find((u) => u.id === userId)?.name;
  return name ? <> oleh {name}</> : null;
}

function LinkDialog({
  open,
  link,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  link?: FormLink;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: FormLinkInput) => Promise<void>;
}) {
  const [form, setForm] = useState<FormLinkInput>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [urlTouched, setUrlTouched] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);

  // Reset the fields each time the dialog opens.
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setForm(
        link ? { title: link.title, url: link.url, description: link.description } : EMPTY_FORM,
      );
      setSubmitted(false);
      setUrlTouched(false);
    }
  }

  const urlCheck = checkFormLink(form.url);
  const titleError = submitted && !form.title.trim();
  const urlError = (submitted || urlTouched) && !urlCheck.ok ? urlCheck.error : null;

  const submit = () => {
    setSubmitted(true);
    if (!form.title.trim() || !urlCheck.ok) return;
    void onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{link ? "Kemas Kini Pautan" : "Tambah Pautan Borang"}</DialogTitle>
          <DialogDescription>
            Pautan ini boleh dilihat oleh semua admin dan Temanion.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="borang-title" className="text-xs">
              Tajuk *
            </Label>
            <Input
              id="borang-title"
              value={form.title}
              maxLength={FORM_LINK_TITLE_MAX}
              aria-invalid={titleError}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Cth: Borang Laporan Insiden"
            />
            {titleError && (
              <p className="text-xs text-destructive">Sila isi tajuk borang.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="borang-url" className="text-xs">
              Pautan Borang *
            </Label>
            <Input
              id="borang-url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={form.url}
              aria-invalid={!!urlError}
              aria-describedby="borang-url-hint"
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              onBlur={() => {
                if (form.url.trim()) setUrlTouched(true);
              }}
              placeholder="https://forms.gle/..."
            />
            <p
              id="borang-url-hint"
              className={`text-xs ${urlError ? "text-destructive" : "text-muted-foreground"}`}
            >
              {urlError ??
                "Contoh: Google Forms, Microsoft Forms atau Jotform. Pautan API, webhook dan alamat IP tidak dibenarkan."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="borang-description" className="text-xs">
              Penerangan
            </Label>
            <Textarea
              id="borang-description"
              rows={3}
              maxLength={FORM_LINK_DESCRIPTION_MAX}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Bila dan untuk apa borang ini digunakan..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : link ? "Kemas Kini" : "Simpan Pautan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

const EMPTY_COPY: Record<Tab, { icon: typeof Archive; title: string; body: string }> = {
  active: {
    icon: ClipboardPen,
    title: "Belum ada pautan borang",
    body: "Tambah pautan borang pertama untuk dikongsi bersama pasukan.",
  },
  archived: {
    icon: Archive,
    title: "Tiada pautan diarkibkan",
    body: "Pautan yang diarkibkan dipaparkan di sini dan boleh diaktifkan semula bila-bila masa.",
  },
  deleted: {
    icon: Trash2,
    title: "Tiada pautan dipadam",
    body: "Pautan yang dipadam disimpan di sini supaya boleh dipulihkan.",
  },
};

function EmptyState({
  tab,
  searching,
  onAdd,
}: {
  tab: Tab;
  searching: boolean;
  onAdd: () => void;
}) {
  const copy = EMPTY_COPY[tab];
  const Icon = searching ? Search : copy.icon;
  return (
    <Card className="border-border/60 p-10 text-center">
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-full gradient-sage text-sage-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium">
        {searching ? "Tiada pautan sepadan" : copy.title}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
        {searching ? "Cuba kata kunci lain, atau semak tab yang lain." : copy.body}
      </p>
      {!searching && tab === "active" && (
        <Button size="sm" className="mt-4" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Pautan
        </Button>
      )}
    </Card>
  );
}
