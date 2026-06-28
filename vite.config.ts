// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Static SPA build for GitHub Pages — no SSR, no Nitro/Cloudflare worker.
  // Vite-only build emits to dist/; the postbuild step
  // (scripts/gh-pages-postbuild.mjs) adds 404.html + .nojekyll for
  // client-side routing and underscore-prefixed assets.
  nitro: false,
  tanstackStart: {
    // Prerender only the shell to index.html; all routing happens client-side.
    spa: { enabled: true },
  },
  vite: {
    // Served from https://teamcaregiver.github.io/teman01/ (project page).
    base: '/teman01/',
  },
});


