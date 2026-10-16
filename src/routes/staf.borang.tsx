import { createFileRoute } from "@tanstack/react-router";
import { BorangPage } from "@/components/borang-page";

export const Route = createFileRoute("/staf/borang")({
  component: StaffBorang,
});

// Same board as /admin/borang — rendered inside each role layout so the
// sidebar and chrome stay put.
function StaffBorang() {
  return <BorangPage />;
}
