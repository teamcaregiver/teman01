// Make the static Vite SPA build deployable on GitHub Pages.
//
// TanStack Start's SPA mode emits the bootable shell as `dist/client/_shell.html`
// (no index.html). GitHub Pages needs:
//   - index.html → served at the site root (/teman01/)
//   - 404.html   → a copy of the shell, so client-side routes resolve on deep
//                  links and hard refreshes (GitHub Pages has no SPA fallback)
//   - .nojekyll  → so underscore-prefixed files/dirs are served as-is
import { copyFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const dir = "dist/client";

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

const indexPath = join(dir, "index.html");
const shellPath = join(dir, "_shell.html");

// Use a real index.html if one was emitted, otherwise promote the SPA shell.
if (!(await exists(indexPath))) {
  if (await exists(shellPath)) {
    await copyFile(shellPath, indexPath);
  } else {
    console.warn(
      `[gh-pages-postbuild] WARNING: neither index.html nor _shell.html found in ${dir} — ` +
        "the SPA shell prerender may not have run. Skipping.",
    );
    process.exit(0);
  }
}

await copyFile(indexPath, join(dir, "404.html"));
await writeFile(join(dir, ".nojekyll"), "");
console.log("[gh-pages-postbuild] wrote index.html + 404.html + .nojekyll to", dir);
