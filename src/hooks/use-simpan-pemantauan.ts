import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { addPemantauanEntry } from "@/lib/tracker-actions";
import { qk, useInvalidate } from "@/lib/data";

type Column = Parameters<typeof addPemantauanEntry>[2];

/**
 * Saves one Manual 3 monitoring entry into today's record, then goes back to
 * the resident's Rekod Harian page — the same flow as the vital / makanan forms.
 */
export function useSimpanPemantauan(parentId: string, staffId: string) {
  const navigate = useNavigate();
  const invalidate = useInvalidate();
  const [saving, setSaving] = useState(false);

  const simpan = async <C extends Column>(
    column: C,
    entry: Parameters<typeof addPemantauanEntry<C>>[3],
    berjaya: string,
  ) => {
    if (saving) return;
    setSaving(true);
    try {
      await addPemantauanEntry(parentId, staffId, column, entry);
      invalidate(qk.trackers);
      toast.success(berjaya);
      navigate({ to: "/staf/tracker/$parentId", params: { parentId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan rekod");
    } finally {
      setSaving(false);
    }
  };

  return { saving, simpan };
}
