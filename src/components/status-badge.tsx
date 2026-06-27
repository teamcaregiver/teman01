import { cn } from "@/lib/utils";
import type { TrackerStatus } from "@/lib/mock-data";

const map: Record<TrackerStatus, { label: string; cls: string }> = {
  normal: { label: "Normal", cls: "bg-[color:var(--status-normal)]/15 text-[color:var(--status-normal)] ring-[color:var(--status-normal)]/30" },
  attention: { label: "Perlu Perhatian", cls: "bg-[color:var(--status-attention)]/15 text-[color:var(--status-attention)] ring-[color:var(--status-attention)]/30" },
  critical: { label: "Kritikal", cls: "bg-[color:var(--status-critical)]/15 text-[color:var(--status-critical)] ring-[color:var(--status-critical)]/30" },
};

export function StatusBadge({ status, className }: { status: TrackerStatus; className?: string }) {
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", s.cls, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
