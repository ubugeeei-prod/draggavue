# draggavue — development guide

Vue drag & drop primitives. Vite+ (`vp`) is the only entry point —
there are **no npm scripts**; every command is a Vite Task.

## Commands

```sh
vp install              # dependencies (pnpm 11 underneath)
vp run ready            # fmt --fix → vize check → vize lint → tests → build
vp run check            # fmt + oxlint + vize check (type-aware, Vue-native)
vp run test             # all Vitest projects
vp run test:browser     # browser project only (playwright/chromium)
vp run size             # bundle budgets — hard-fails when exceeded
vp run dev              # playground app (vite.config.playground.ts)
vp run musea            # component gallery (stories/*.art.vue)
vp run release minor    # tag-driven release → OIDC npm publish
```

## Architecture rules

Follow [ubugeeei-prod/style-guide.vue](https://github.com/ubugeeei-prod/style-guide.vue). The load-bearing points here:

- **MVVM split.** Pure logic lives in plain TS (`drag.ts`, `sortable.ts`,
  `geometry.ts`) as arrow functions with signature-first declarations
  (`export type f = …; export const f: f = …`). Composables are thin
  reactive bindings using `function` declarations. New behavior goes
  into the pure layer first.
- **ADTs everywhere.** Impossible states must not typecheck. See
  `DragState` / `DragTransition` — transitions return effects, the
  reactivity layer only pattern-matches.
- **Colocation.** No `components/` / `composables/` buckets — features
  own their directory (`draggable/`, `sortable/`, `a11y/`, `shared/`).
- **~300 lines per file.** Split by concern when a file outgrows it
  (`.def.ts` for public contracts is the sanctioned pattern).
- **Branded units.** Raw numbers become `Px` via `px()` at the
  boundary; never `as` casts in geometry math.
- **TSDoc is the documentation.** Rust-stdlib richness: summary,
  semantics paragraphs, `@default` for every default, runnable
  `@example` blocks, `{@link}` cross-references. There is no docs
  site; the editor is the docs.

## Toolchain constraints worth knowing

- **TypeScript 7 + Vize.** `vue-tsc` cannot run on TS 7, so SFC
  declaration files are hand-written constructor contracts
  (`Draggable.ts`, `SortableList.ts`) validated by `vize check`.
  Upstream ask: ubugeeei-prod/vize#3066. Keep contracts in sync when
  props/emits/slots change.
- **Vite Task has no shell.** Task commands get no glob expansion and
  no `&&` — multi-step work is a command array or a Node script in
  `scripts/`.
- **Tests:** unit (node) + Vitest Browser Mode (`*.browser.test.ts`,
  real Chromium). No component-mount unit tests — behavior is proven
  in the browser project instead.

## CI / merging

Seven parallel Blacksmith jobs (fmt, oxlint, vize-lint, typecheck,
unit, browser, build) + `size`. The `automerge` job squash-merges
every green non-draft PR — do not merge manually. `main` is
PR-only, squash-only via repository ruleset.

## Releasing

`vp run release [patch|minor|major]` tags main and pushes the tag;
`release.yml` applies the version from the tag and publishes with
OIDC trusted publishing. The repo's `package.json` version stays at
`0.0.0` — tags are the single source of truth.
