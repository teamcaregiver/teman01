import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

// Live date & time shown on each add-record form, so staff sees the exact
// timestamp that will be saved with the entry (captured on submit).
export function NowStamp() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-teal/30 bg-teal/10 p-3 text-sm">
      <Clock className="h-4 w-4 shrink-0 text-teal" />
      <span className="text-muted-foreground">Masa rekod:</span>
      <span className="font-medium text-foreground">
        {format(now, "EEEE, dd MMM yyyy")}
      </span>
      <span className="text-muted-foreground">·</span>
      <span className="font-mono font-semibold text-foreground">
        {format(now, "HH:mm:ss")}
      </span>
    </div>
  );
}
