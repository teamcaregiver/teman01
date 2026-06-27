import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { AnakBottomNav } from "@/components/anak-bottom-nav";
import { AnakSidebar } from "@/components/anak-sidebar";
import { getCurrentUser, signOut, useAuth } from "@/lib/auth-store";
import { PageTransition } from "@/components/page-transition";
import { Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/anak")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const u = getCurrentUser();
    if (!u) throw redirect({ to: "/login" });
    if (u.role !== "anak") throw redirect({ to: u.role === "admin" ? "/admin" : "/staf" });
  },
  component: AnakLayout,
});

function AnakLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AnakSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        {/* Mobile-only top header; on desktop the sidebar carries the brand + logout */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/anak" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl gradient-teal">
                <Heart className="h-4 w-4 text-teal-foreground" />
              </div>
              <div>
                <p className="font-display text-sm font-bold leading-none">CareSenior</p>
                <p className="text-[11px] text-muted-foreground">{user?.name}</p>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate({ to: "/login" }); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-md px-4 py-5 md:max-w-5xl md:px-8 md:py-8 xl:max-w-6xl">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <AnakBottomNav />
    </div>
  );
}
