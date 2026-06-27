import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Heart,
  Users,
  UserPlus,
  BookOpen,
  Video,
  Activity,
  ClipboardList,
  LogOut,
  LayoutDashboard,
  HeartHandshake,
} from "lucide-react";
import { signOut, useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";

const adminNav = [
  { title: "Ringkasan", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Pengurusan Staf", url: "/admin/staff", icon: Users },
  { title: "Warga Emas", url: "/admin/warga-emas", icon: Heart },
  { title: "Daftar Warga Emas", url: "/admin/warga-emas/baru", icon: UserPlus },
  { title: "Artikel", url: "/admin/artikel", icon: BookOpen },
  { title: "Video", url: "/admin/video", icon: Video },
  { title: "Rekod Harian", url: "/admin/tracker", icon: Activity },
  { title: "Servis Monitoring", url: "/admin/servis", icon: HeartHandshake },
];

const staffNav = [
  { title: "Ringkasan", url: "/staf", icon: LayoutDashboard, exact: true },
  { title: "Warga Emas Saya", url: "/staf/warga-emas", icon: Heart },
  { title: "Rekod Saya", url: "/staf/rekod", icon: ClipboardList },
];

export function AppSidebar({ variant }: { variant: "admin" | "staff" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const navigate = useNavigate();
  const items = variant === "admin" ? adminNav : staffNav;
  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-teal">
            <Heart className="h-4 w-4 text-teal-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold">
              CareSenior
            </p>
            <p className="truncate text-xs text-muted-foreground capitalize">
              {variant === "admin" ? "Admin" : "Staf"}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="px-2 py-1">
          <p className="truncate text-xs font-medium">{user?.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2"
          onClick={() => {
            signOut();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" /> Log Keluar
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
