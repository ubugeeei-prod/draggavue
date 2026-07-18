#!/usr/bin/env node
// Tag-driven release: `vp run release [patch|minor|major]`.
//
// Computes the next version from the latest `v*` tag, tags the
// current main HEAD, and pushes the tag. Nothing is committed to
// main, so branch protection stays fully enforced — the release
// workflow applies the version to package.json at publish time.

import { execSync } from "node:child_process";
import process from "node:process";

const run = (command) =>
  execSync(command, { stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();

const fail = (message) => {
  console.error(`release: ${message}`);
  process.exit(1);
};

const KINDS = new Set(["patch", "minor", "major"]);
const kind = process.argv[2] ?? "patch";
if (!KINDS.has(kind)) fail(`unknown bump "${kind}" — use patch, minor, or major`);

if (run("git branch --show-current") !== "main") fail("switch to main first");
if (run("git status --porcelain") !== "") fail("working tree is not clean");

run("git fetch origin main --tags");
if (run("git rev-parse main") !== run("git rev-parse origin/main")) {
  fail("main is not in sync with origin — pull or push first");
}

const tags = run("git tag --list 'v*' --sort=-v:refname").split("\n").filter(Boolean);
const latest = tags[0] ?? "v0.0.0";
const parts = latest.slice(1).split(".").map(Number);
if (parts.length !== 3 || parts.some(Number.isNaN)) fail(`latest tag ${latest} is not semver`);

const [major, minor, patch] = parts;
const next =
  kind === "major"
    ? `${major + 1}.0.0`
    : kind === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

run(`git tag v${next} main`);
run(`git push origin v${next}`);

console.log(`\nTagged v${next} (was ${latest}).`);
console.log("The Release workflow now type-checks, tests, builds, and publishes");
console.log("to npm via OIDC trusted publishing. Watch it here:");
console.log("  https://github.com/ubugeeei-prod/draggavue/actions/workflows/release.yml\n");
