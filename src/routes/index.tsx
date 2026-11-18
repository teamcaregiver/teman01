import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  // Keep the hash: an auth link that falls back to the Site URL lands here with
  // the session (or error) in it, and supabase-js may not have read it yet.
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/login", hash: location.hash });
  },
});
