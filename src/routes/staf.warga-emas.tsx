import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParents } from "@/lib/data";
import { OPENABLE_CLASS, openOnClick } from "@/lib/row-click";
import { cn } from "@/lib/utils";
import { StaggerItem, StaggerList } from "@/components/page-transition";
import { ElderlyInfoDialog } from "@/components/elderly-info-dialog";
import { GenderAvatar } from "@/components/gender-avatar";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/staf/warga-emas")({
  component: AssignedParents,
});

function AssignedParents() {
  const navigate = useNavigate();
  // RLS returns the people this Temanion looks after: assigned to them, or
  // on one of their open bookings (migration 0014).
  const list = useParents();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Penerima Servis</h1>
        <p className="text-sm text-muted-foreground">
          Penerima servis yang ditugaskan kepada anda.
        </p>
      </div>
      <StaggerList>
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => (
            <StaggerItem key={p.id}>
              {/* The whole card opens Rekod Harian; the info button keeps its own action. */}
              <Card
                className={cn("hover-lift rounded-xl border-border/60 p-5", OPENABLE_CLASS)}
                {...openOnClick(
                  () =>
                    void navigate({
                      to: "/staf/tracker/$parentId",
                      params: { parentId: p.id },
                    }),
                  `Buka Rekod Harian ${p.fullName}`,
                )}
              >
                <div className="flex items-start gap-3">
                  <GenderAvatar gender={p.gender} />
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
