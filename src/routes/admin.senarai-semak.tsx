import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChecklistItemsEditor } from "@/components/checklist-editor";
import { GenderAvatar } from "@/components/gender-avatar";
import { DEFAULT_CHECKLIST } from "@/lib/mock-data";
import {
  prepareChecklist,
  sameChecklist,
  saveDefaultChecklist,
} from "@/lib/checklists";
import type { ChecklistTemplateItem } from "@/lib/checklists";
import {
  qk,
  useCustomChecklistParentIdsQuery,
  useDefaultChecklistQuery,
  useInvalidate,
  useParents,
} from "@/lib/data";
import { ChevronRight, Info, ListChecks, RotateCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/senarai-semak")({
  component: SenaraiSemakDefault,
});

/** Admin edits the default daily checklist used by every resident without their own list. */
function SenaraiSemakDefault() {
  const defaultQ = useDefaultChecklistQuery();
  const customQ = useCustomChecklistParentIdsQuery();
  const parents = useParents();
  const invalidate = useInvalidate();
  // The saved default: admin's list, or the built-in one until it is changed.
  const saved = defaultQ.data ?? DEFAULT_CHECKLIST;
  const [draft, setDraft] = useState<ChecklistTemplateItem[]>(saved);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);

  // Start from the saved list once it loads, and again after each save.
  useEffect(() => {
    setDraft(saved.map((it) => ({ ...it })));
    setNewLabel("");
  }, [saved]);

  const dirty = !sameChecklist(draft, saved) || newLabel.trim() !== "";

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    const result = prepareChecklist(draft, newLabel);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setSaving(true);
    try {
      await saveDefaultChecklist(result.items);
      invalidate(qk.checklists);
      toast.success("Senarai semak default disimpan");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Gagal menyimpan senarai semak",
      );
    } finally {
      setSaving(false);
    }
  };

  const customIds = new Set(customQ.data ?? []);
  const custom = parents.filter((p) => customIds.has(p.id));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">
          Senarai Semak Default
        </h1>
        <p className="text-sm text-muted-foreground">
          Tugasan harian yang ditanda oleh Temanion untuk setiap penerima
          servis.
        </p>
      </div>

      <Card className="border-border/60 p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold">
                Senarai default
              </h2>
              {!defaultQ.isPending && !defaultQ.isError && (
                <Badge
                  variant="outline"
                  className="bg-muted text-muted-foreground"
                >
                  {defaultQ.data ? "Diubah oleh admin" : "Senarai asal sistem"}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {saved.length} tugasan · digunakan oleh penerima servis yang tiada
              senarai khas.
            </p>
          </div>
        </div>

        {defaultQ.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : defaultQ.isError ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-status-critical/5 p-3 text-xs">
            <span className="text-muted-foreground">
              Gagal memuatkan senarai default:{" "}
              {(defaultQ.error as Error).message}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void defaultQ.refetch()}
            >
              Cuba lagi
            </Button>
          </div>
        ) : (
          <>
            <ChecklistItemsEditor
              items={draft}
              onChange={setDraft}
              newLabel={newLabel}
              onNewLabelChange={setNewLabel}
              disabled={saving}
            />
            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() =>
                  setDraft(DEFAULT_CHECKLIST.map((c) => ({ ...c })))
                }
                disabled={saving || sameChecklist(draft, DEFAULT_CHECKLIST)}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Guna senarai asal
                sistem
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setDraft(saved.map((it) => ({ ...it })));
                    setNewLabel("");
                  }}
                  disabled={saving || !dirty}
                >
                  <Undo2 className="mr-1 h-4 w-4" /> Batal perubahan
                </Button>
                <Button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving || !dirty}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="border-border/60 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-teal text-teal-foreground">
            <ListChecks className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold">
              Penerima servis dengan senarai khas
              {customQ.data && ` (${custom.length})`}
            </h2>
            <p className="mt-0.5 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
              Senarai mereka tidak berubah apabila senarai default diubah. Untuk
              kembali ke senarai default, buka penerima servis, pilih Urus
              Senarai, kemudian Guna senarai default.
            </p>
          </div>
        </div>

        {customQ.isPending ? (
          <Skeleton className="mt-4 h-12 w-full" />
        ) : customQ.isError ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Gagal memuatkan senarai: {(customQ.error as Error).message}
          </p>
        ) : custom.length === 0 ? (
          <p className="mt-4 rounded-lg bg-muted/40 p-3 text-center text-xs text-muted-foreground">
            Semua penerima servis menggunakan senarai default.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {custom.map((p) => (
              <Link
                key={p.id}
                to="/admin/warga-emas/$parentId"
                params={{ parentId: p.id }}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <GenderAvatar
                  gender={p.gender}
                  className="h-9 w-9 rounded-xl"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {p.fullName}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
