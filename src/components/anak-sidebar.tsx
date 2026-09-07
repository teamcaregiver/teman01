import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut } from "lucide-react";
import { anakNavItems } from "@/components/anak-bottom-nav";
import { signOut, useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const initialsOf = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export function AnakSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/50 md:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-teal">
          <Heart className="h-5 w-5 text-teal-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold leading-tight">CareSenior</p>
          <p className="truncate text-xs text-muted-foreground">{user?.name}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {anakNavItems.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <it.icon className="h-5 w-5 shrink-0" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <Link
          to="/anak/profil"
          title="Profil Saya"
          className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Avatar className="h-8 w-8 shrink-0">
            {user?.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
            <AvatarFallback className="gradient-teal text-[10px] font-bold text-teal-foreground">
              {initialsOf(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={() => {
            signOut();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="h-5 w-5" /> Keluar
        </Button>
      </div>
    </aside>
  );
}
