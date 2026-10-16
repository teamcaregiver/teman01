import { useEffect, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_CHECKLIST } from "@/lib/mock-data";
import {
  CHECKLIST_LABEL_MAX,
  CHECKLIST_MAX_ITEMS,
  isDefaultChecklist,
  newChecklistItemId,
  saveParentChecklist,
} from "@/lib/checklists";
import type { ChecklistTemplateItem } from "@/lib/checklists";
import { qk, useInvalidate, useParentChecklistQuery } from "@/lib/data";
import { toast } from "sonner";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

/** "Senarai khas" when the resident has their own list, else "Senarai default". */
export function ChecklistKindBadge({ custom }: { custom: boolean }) {
  return custom ? (
    <Badge variant="outline" className="border-teal/40 bg-teal/15 text-teal-foreground">
      Senarai khas
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-muted text-muted-foreground">
      Senarai default
    </Badge>
  );
}

/**
 * Edit one resident's daily checklist: rename, add or remove items. The
 * change applies to this resident only; everyone else keeps their own list,
 * and new residents start from the default.
 */
export function ChecklistEditorDialog({
  parentId,
  parentName,
  items,
  open,
  onOpenChange,
  onSaved,
}: {
  parentId: string;
  parentName: string;
  items: ChecklistTemplateItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (items: ChecklistTemplateItem[]) => void;
}) {
  const invalidate = useInvalidate();
  const [draft, setDraft] = useState<ChecklistTemplateItem[]>(items);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  // Start from the current list every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setDraft(items.map((it) => ({ ...it })));
    setNewLabel("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const full = draft.length >= CHECKLIST_MAX_ITEMS;

  const rename = (id: string, label: string) =>
    setDraft((d) => d.map((it) => (it.id === id ? { ...it, label } : it)));
  const remove = (id: string) => setDraft((d) => d.filter((it) => it.id !== id));
  const add = () => {
    const label = newLabel.trim();
    if (!label || full) return;
    setDraft((d) => [...d, { id: newChecklistItemId(), label }]);
    setNewLabel("");
  };

  const save = async () => {
    // A typed-but-not-added item is kept rather than silently dropped.
    const pending = newLabel.trim();
    const next = [
      ...draft.map((it) => ({ ...it, label: it.label.trim() })),
      ...(pending && !full ? [{ id: newChecklistItemId(), label: pending }] : []),
    ];
    if (next.length === 0) {
      toast.error("Senarai mesti ada sekurang-kurangnya satu item.");
      return;
    }
    if (next.some((it) => !it.label)) {
      toast.error("Ada item yang kosong. Isi atau buang item tersebut.");
      return;
    }
    setSaving(true);
    try {
      await saveParentChecklist(parentId, next);
      invalidate([...qk.checklists, parentId]);
      toast.success(`Senarai semak ${parentName} disimpan`);
      onSaved?.(next);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan senarai semak");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Urus Senarai Semak</DialogTitle>
          <DialogDescription>
            Perubahan ini untuk <span className="font-medium text-foreground">{parentName}</span>{" "}
            sahaja. Penerima servis lain kekal dengan senarai masing-masing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {draft.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              Tiada item. Tambah sekurang-kurangnya satu item di bawah.
            </p>
          )}
          {draft.map((it, i) => (
            <div key={it.id} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">{i + 1}.</span>
              <Input
                value={it.label}
                maxLength={CHECKLIST_LABEL_MAX}
                onChange={(e) => rename(it.id, e.target.value)}
                aria-label={`Item ${i + 1}`}
                placeholder="Nama tugasan"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-status-critical"
                onClick={() => remove(it.id)}
                aria-label={`Buang ${it.label || `item ${i + 1}`}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-4">
          <Input
            value={newLabel}
            maxLength={CHECKLIST_LABEL_MAX}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={full ? `Maksimum ${CHECKLIST_MAX_ITEMS} item` : "Tambah tugasan baru…"}
            aria-label="Tugasan baru"
            disabled={full}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={add}
            disabled={!newLabel.trim() || full}
          >
            <Plus className="mr-1 h-4 w-4" /> Tambah
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:items-center sm:justify-between sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setDraft(DEFAULT_CHECKLIST.map((c) => ({ ...c })))}
            disabled={saving || isDefaultChecklist(draft)}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Guna senarai default
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Admin resident page: the resident's checklist, with the editor behind a button. */
export function ParentChecklistCard({
  parentId,
  parentName,
}: {
  parentId: string;
  parentName: string;
}) {
  const q = useParentChecklistQuery(parentId);
  const items = q.data ?? DEFAULT_CHECKLIST;
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-border/60 p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold">Senarai Semak Harian</h2>
            {!q.isPending && !q.isError && <ChecklistKindBadge custom={!!q.data} />}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tugasan harian yang ditanda oleh Temanion untuk penerima servis ini.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={q.isPending || q.isError}
        >
          <Pencil className="mr-1 h-3.5 w-3.5" /> Urus Senarai
        </Button>
      </div>

      {q.isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-status-critical/5 p-3 text-xs">
          <span className="text-muted-foreground">
            Gagal memuatkan senarai semak: {(q.error as Error).message}
          </span>
          <Button variant="outline" size="sm" onClick={() => void q.refetch()}>
            Cuba lagi
          </Button>
        </div>
      ) : (
        <ol className="grid gap-2 sm:grid-cols-2">
          {items.map((it, i) => (
            <li
              key={it.id}
              className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0">{it.label}</span>
            </li>
          ))}
        </ol>
      )}

      <ChecklistEditorDialog
        parentId={parentId}
        parentName={parentName}
        items={items}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
  );
}
