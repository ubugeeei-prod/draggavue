#!/usr/bin/env node
// Minify the distributable stylesheets into dist/styles.
//
// The sources keep their documentation headers; consumers get the
// bytes. The minifier is a few regexes — safe here because these
// are our own three stylesheets with no strings or url() payloads —
// which keeps the build free of extra dependencies.
//
// A plain Node script because Vite Task spawns commands without a
// shell (no globs, no `&&`).

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const minify = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/ ?([{}:;,>]) ?/g, "$1")
    .replace(/;}/g, "}")
    .trim();

mkdirSync("dist/styles", { recursive: true });

const sources = readdirSync("src/styles").filter((file) => file.endsWith(".css"));

for (const file of sources) {
  const source = readFileSync(`src/styles/${file}`, "utf8");
  writeFileSync(`dist/styles/${file}`, `${minify(source)}\n`);
}

console.log(`styles: minified ${sources.length} stylesheets into dist/styles`);
