import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parents, users } from "@/lib/mock-data";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { StaggerItem, StaggerList } from "@/components/page-transition";

export const Route = createFileRoute("/admin/warga-emas/")({
  component: WargaPage,
});

function WargaPage() {
  const [q, setQ] = useState("");
  const list = parents.filter((p) => p.fullName.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Warga Emas</h1>
          <p className="text-sm text-muted-foreground">Senarai semua warga emas berdaftar.</p>
        </div>
        <Button asChild>
          <Link to="/admin/warga-emas/baru"><Plus className="mr-1 h-4 w-4" /> Daftar Baru</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Cari nama warga emas..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <StaggerList>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const staff = users.find((u) => u.id === p.staffId);
            return (
              <StaggerItem key={p.id}>
                <Link to="/admin/warga-emas/$parentId" params={{ parentId: p.id }}>
                  <Card className="hover-lift border-border/60 p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-peach font-display font-bold text-peach-foreground">
                        {p.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display font-semibold">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.ic} · {p.gender === "L" ? "Lelaki" : "Perempuan"}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <p><span className="font-medium text-foreground">Kondisi:</span> {p.medicalCondition}</p>
                      <p><span className="font-medium text-foreground">Penjaga:</span> {staff?.name ?? "Belum ditetapkan"}</p>
                      <p><span className="font-medium text-foreground">Anak terpaut:</span> {p.anakIds.length}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="bg-sage/20 text-sage-foreground">{p.relationship}</Badge>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
        </div>
      </StaggerList>
    </div>
  );
}
