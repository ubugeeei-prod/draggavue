#!/usr/bin/env node
// Bundle-size report and budget gate: `vp run size` (after a build).
//
// Measures what consumers actually pay: each entry is tree-shaken
// out of dist/index.js, minified, and gzipped, exactly like a
// production bundler would. Budgets are hard limits — the script
// exits non-zero when any entry crosses its line.

import { readFileSync, readdirSync } from "node:fs";
import process from "node:process";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const ENTRIES = [
  { label: "full library", code: 'export * from "./dist/index.js";', budget: 7_500 },
  {
    label: "useDraggable only",
    code: 'export { useDraggable } from "./dist/index.js";',
    budget: 4_000,
  },
  { label: "Draggable only", code: 'export { Draggable } from "./dist/index.js";', budget: 4_500 },
  {
    label: "useSortable only",
    code: 'export { useSortable } from "./dist/index.js";',
    budget: 4_500,
  },
  {
    label: "SortableList only",
    code: 'export { SortableList } from "./dist/index.js";',
    budget: 5_000,
  },
  {
    label: "pure core only",
    code: 'export { press, movePointer, release, reorder, targetIndexOf } from "./dist/index.js";',
    budget: 1_500,
  },
];

const STYLE_BUDGET = 1_500;

const gzipSize = (contents) => gzipSync(contents, { level: 9 }).length;

const measure = async (code) => {
  const result = await build({
    stdin: { contents: code, resolveDir: process.cwd(), loader: "js" },
    bundle: true,
    minify: true,
    format: "esm",
    external: ["vue"],
    write: false,
    logLevel: "silent",
  });
  const output = result.outputFiles[0]?.contents ?? new Uint8Array();
  return { raw: output.length, gzip: gzipSize(output) };
};

const kb = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;

let failed = false;
const rows = [];

for (const entry of ENTRIES) {
  const { raw, gzip } = await measure(entry.code);
  const over = gzip > entry.budget;
  if (over) failed = true;
  rows.push({
    entry: entry.label,
    "min ": kb(raw),
    gzip: kb(gzip),
    budget: kb(entry.budget),
    ok: over ? "OVER" : "ok",
  });
}

const styles = readdirSync("dist/styles").filter((file) => file.endsWith(".css"));
const styleTotal = styles.reduce(
  (total, file) => total + gzipSize(readFileSync(`dist/styles/${file}`)),
  0,
);
if (styleTotal > STYLE_BUDGET) failed = true;
rows.push({
  entry: `styles (${styles.length} files)`,
  "min ": "—",
  gzip: kb(styleTotal),
  budget: kb(STYLE_BUDGET),
  ok: styleTotal > STYLE_BUDGET ? "OVER" : "ok",
});

console.table(rows);

if (failed) {
  console.error("size: budget exceeded — see the OVER rows above.");
  process.exit(1);
}
console.log("size: every entry is inside its budget.");
