import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parents } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { ElderlyInfoDialog } from "@/components/elderly-info-dialog";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/staf/warga-emas")({
  component: AssignedParents,
});

function AssignedParents() {
  const { user } = useAuth();
  const list = parents.filter((p) => p.staffId === user?.id);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Warga Emas Saya</h1>
        <p className="text-sm text-muted-foreground">
          Warga emas yang ditugaskan kepada anda.
        </p>
      </div>
      <StaggerList>
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => (
            <StaggerItem key={p.id}>
              <Card className="hover-lift border-border/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-sage font-display font-bold text-sage-foreground">
                    {p.fullName
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold">
                      {p.fullName}
                    </p>
                  </div>
                  <ElderlyInfoDialog parent={p} />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button asChild>
                    <Link
                      to="/staf/tracker/$parentId"
                      params={{ parentId: p.id }}
                    >
                      Rekod Tracker <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </div>
      </StaggerList>
    </div>
  );
}
