// Unit tests run in plain Node, without the app's Vite/TanStack plugins.
// `npm test` runs everything; the database tests in supabase/tests skip
// themselves unless a LOCAL Supabase is configured (see that folder).
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "supabase/tests/**/*.test.ts"],
    environment: "node",
  },
});
