#!/usr/bin/env node
// Copy the distributable stylesheets into dist/styles.
//
// A plain Node script instead of `cp src/styles/*.css` because Vite
// Task spawns commands without a shell — no glob expansion, no `&&`.

import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist/styles", { recursive: true });

cpSync("src/styles", "dist/styles", {
  recursive: true,
  // Only the stylesheets themselves — tests and screenshot
  // directories live alongside them in src/styles.
  filter: (source) => source.endsWith("styles") || source.endsWith(".css"),
});
