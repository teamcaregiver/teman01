import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile-page";

export const Route = createFileRoute("/admin/profil")({
  component: AdminProfile,
});

// Same page for every role — rendered inside each role layout so the sidebar
// and chrome stay put.
function AdminProfile() {
  return <ProfilePage />;
}
