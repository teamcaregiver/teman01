import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  BookOpen,
  UserPlus,
  Activity,
  CalendarHeart,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const anakNavItems = [
  { to: "/anak", label: "Utama", short: "Utama", icon: Home, exact: true },
  {
    to: "/anak/informasi",
    label: "Manual Caregiver",
    short: "Manual",
    icon: BookOpen,
    exact: false,
  },
  {
    to: "/anak/service",
    label: "Servis",
    short: "Servis",
    icon: CalendarHeart,
    exact: false,
  },
  {
    to: "/anak/daftar-warga",
    label: "Daftar",
    short: "Daftar",
    icon: UserPlus,
    exact: false,
  },
  {
    to: "/anak/perkembangan",
    label: "Progres",
    short: "Progres",
    icon: Activity,
    exact: false,
  },
] as const;

export function AnakBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {anakNavItems.map((it) => {
          const active = it.exact
            ? pathname === it.to
            : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <it.icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110",
                )}
              />
              <span>{it.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
