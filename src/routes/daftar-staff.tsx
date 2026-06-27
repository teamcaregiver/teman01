import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "./daftar-anak";

export const Route = createFileRoute("/daftar-staff")({
  head: () => ({ meta: [{ title: "Daftar Staf — CareSenior" }] }),
  component: () => <RegisterForm role="staff" />,
});
