import { cn } from "@/lib/utils";
import { BOOKING_STATUS_LABEL } from "@/lib/mock-data";
import type { BookingStatus } from "@/lib/mock-data";

const statusTone: Record<BookingStatus, string> = {
  pending: "bg-status-attention/15 text-status-attention",
  confirmed: "bg-teal/20 text-teal-foreground",
  ongoing: "bg-primary/15 text-primary",
  completed: "bg-status-normal/15 text-status-normal",
  cancelled: "bg-muted text-muted-foreground",
};

/** Booking status chip shared by Servis Monitoring and the admin dashboard. */
export function BookingStatusPill({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
        statusTone[status],
        className,
      )}
    >
      {BOOKING_STATUS_LABEL[status]}
    </span>
  );
}
