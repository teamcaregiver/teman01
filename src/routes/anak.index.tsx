import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useParents, useTrackers } from "@/lib/data";
import { useAuth } from "@/lib/auth-store";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { ChevronRight, Heart, Activity } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export const Route = createFileRoute("/anak/")({
  component: AnakHome,
});

function AnakHome() {
  const { user } = useAuth();
  const parents = useParents();
  const trackers = useTrackers();
  const myParents = parents.filter((p) => p.anakIds.includes(user?.id ?? ""));

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-hero p-5 shadow-soft"
      >
        <p className="text-xs font-medium text-muted-foreground">Selamat datang kembali</p>
        <h1 className="mt-1 font-display text-xl font-bold">{user?.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pantau kesihatan orang tersayang dengan mudah.</p>
      </motion.div>

      <h2 className="font-display text-lg font-bold">Orang Tersayang</h2>
      <StaggerList>
        <div className="grid gap-3 sm:grid-cols-2">
          {myParents.map((p) => {
            const last = trackers.filter(t => t.parentId === p.id).sort((a,b)=>+new Date(b.date)-+new Date(a.date))[0];
            return (
              <StaggerItem key={p.id}>
                <Link to="/anak/perkembangan/$parentId" params={{ parentId: p.id }}>
                  <Card className="hover-lift border-border/60 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-peach">
                        <Heart className="h-5 w-5 text-peach-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display font-semibold">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.relationship}</p>
                        {last && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <Activity className="mr-1 inline h-3 w-3" />
                            {format(new Date(last.date), "dd MMM, HH:mm")}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
          {myParents.length === 0 && (
            <Card className="border-dashed p-6 text-center text-sm text-muted-foreground sm:col-span-2">
              Belum ada warga emas berdaftar.{" "}
              <Link to="/anak/daftar-warga" className="text-primary underline">Daftar sekarang</Link>.
            </Card>
          )}
        </div>
      </StaggerList>
    </div>
  );
}
