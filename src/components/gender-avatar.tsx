import { UserRound } from "lucide-react";
import type { Parent } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Profile icon for a care recipient in place of name initials: a person in
// blue for men, pink for women.
export function GenderAvatar({
  gender,
  className,
}: {
  gender: Parent["gender"];
  className?: string;
}) {
  const male = gender === "L";
  return (
    <div
      role="img"
      aria-label={male ? "Lelaki" : "Perempuan"}
      className={cn(
        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
        male
          ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
          : "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300",
        className,
      )}
    >
      <UserRound className="h-6 w-6" strokeWidth={2.25} />
    </div>
  );
}
