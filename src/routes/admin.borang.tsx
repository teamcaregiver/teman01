import { createFileRoute } from "@tanstack/react-router";
import { BorangPage } from "@/components/borang-page";

export const Route = createFileRoute("/admin/borang")({
  component: AdminBorang,
});

// Same board as /staf/borang — rendered inside each role layout so the
// sidebar and chrome stay put.
function AdminBorang() {
  return <BorangPage />;
}
