// Collapse the doubled base prefix in Musea's static gallery output.
//
// Upstream bug ubugeeei-prod/vize#3109: the static export injects
// `staticPreviews` URLs that already carry the full `basePath`, and
// *then* runs its base rewrite, which replaces every `/__musea__/`
// with `basePath + "/"`. With the default basePath (`/__musea__`)
// that replacement is a no-op, so the bug only bites when basePath
// carries a subpath — exactly our GitHub Pages layout
// (`/draggavue/__musea__`, `/draggavue/pr-N/__musea__`). The result
// is `/draggavue/draggavue/__musea__/preview/*.html`: a URL with no
// file behind it, which the SPA 404 fallback then answers with the
// gallery shell — musea nested inside its own preview.
//
// This script undoes the double application: in every text asset it
// rewrites `<prefix><basePath>/` back to `<basePath>/`, where prefix
// is the subpath portion of DRAGGAVUE_MUSEA_BASE. Remove it once
// vize#3109 ships.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = "dist-musea";
const TEXT_ASSET = /\.(?:css|html|js|map|mjs)$/u;

const base = process.env["DRAGGAVUE_MUSEA_BASE"] ?? "/";
const prefix = base.replace(/\/$/, "");

// No subpath, no double prefix — the default build is already fine.
if (prefix === "") {
  console.log("fixMuseaBase: base is '/', nothing to rewrite");
  process.exit(0);
}

const basePath = `${prefix}/__musea__`;
const doubled = `${prefix}${basePath}/`;
const single = `${basePath}/`;

const files = await collect(OUT_DIR);
let touched = 0;

for (const file of files) {
  if (!TEXT_ASSET.test(file)) continue;

  const source = await readFile(file, "utf-8");
  if (!source.includes(doubled)) continue;

  await writeFile(file, source.replaceAll(doubled, single));
  touched += 1;
}

console.log(`fixMuseaBase: rewrote ${doubled} -> ${single} in ${touched} file(s)`);

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else files.push(path);
  }

  return files;
}
