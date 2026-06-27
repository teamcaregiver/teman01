import { createFileRoute } from "@tanstack/react-router";
import { parents } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/anak/perkembangan/")({
  component: PerkembanganIndex,
});

function PerkembanganIndex() {
  const { user } = useAuth();
  const list = parents.filter((p) => p.anakIds.includes(user?.id ?? ""));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold">Pilih Warga Emas</h1>
      <div className="space-y-3">
        {list.map((p) => (
          <Link key={p.id} to="/anak/perkembangan/$parentId" params={{ parentId: p.id }}>
            <Card className="hover-lift flex items-center justify-between border-border/60 p-4">
              <div>
                <p className="font-display font-semibold">{p.fullName}</p>
                <p className="text-xs text-muted-foreground">{p.relationship}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
