import { playwright } from "@vitest/browser-playwright";
import vize from "@vizejs/vite-plugin";
import musea from "@vizejs/vite-plugin-musea";
import { defineConfig } from "vite-plus";

// The Musea gallery hijacks the build pipeline by design (it emits
// its own entry), so it must never sit in the plugin list of the
// library build. The musea tasks opt in through this flag.
const MUSEA = process.env["DRAGGAVUE_MUSEA"] === "1";

// Where the static gallery will be served from. CI sets this to
// the GitHub Pages subdirectory (e.g. /draggavue/pr-12/). It goes
// through Vite's `base`, NOT through musea's basePath: the chunk
// preloader resolves `assets/*` against `base`, so only this split
// keeps gallery URLs and asset URLs on the same prefix. Musea joins
// the two into its public base itself.
const MUSEA_BASE = process.env["DRAGGAVUE_MUSEA_BASE"] ?? "/";

// Second library pass: the same SFCs compiled by Vize's Vapor
// compiler, emitted next to the vdom build as dist/vapor.js.
const VAPOR = process.env["DRAGGAVUE_VAPOR"] === "1";

export default defineConfig({
  base: MUSEA ? MUSEA_BASE : "/",
  plugins: MUSEA
    ? [
        vize(),
        musea({
          include: ["stories/**/*.art.vue"],
          basePath: "/__musea__",
        }),
      ]
    : [vize(VAPOR ? { vapor: true } : {})],
  build: MUSEA
    ? {
        outDir: "dist-musea",
      }
    : {
        lib: {
          entry: VAPOR ? "src/vapor/index.ts" : "src/index.ts",
          formats: ["es"],
          fileName: VAPOR ? "vapor" : "index",
        },
        rollupOptions: {
          external: ["vue"],
        },
        emptyOutDir: !VAPOR,
      },
  test: {
    passWithNoTests: true,
    projects: [
      {
        plugins: [vize()],
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.browser.test.ts", "src/**/*.vapor.test.ts"],
          environment: "node",
        },
      },
      {
        plugins: [vize()],
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        plugins: [vize({ vapor: true })],
        resolve: {
          // Vapor runtime APIs live in the with-vapor build; vue's
          // default bundler entry does not include them yet (3.6-rc).
          alias: { vue: "vue/dist/vue.runtime-with-vapor.esm-browser.js" },
        },
        test: {
          name: "vapor",
          include: ["src/**/*.vapor.test.ts"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
  lint: {
    ignorePatterns: ["dist/**", "dist-musea/**"],
  },
  fmt: {
    semi: true,
    singleQuote: false,
    trailingComma: "all",
  },
  run: {
    tasks: {
      dev: { command: "vp dev -c vite.config.playground.ts", cache: false },
      build: [
        "vp build",
        "env DRAGGAVUE_VAPOR=1 vp build",
        "tsc -p tsconfig.build.json",
        "node scripts/copyStyles.mjs",
      ],
      check: ["vp check", "vize check"],
      "check:fmt": "vp check --no-lint",
      "check:oxlint": "vp check --no-fmt",
      typecheck: "vize check",
      fmt: "vp fmt",
      lint: "vize lint src",
      test: "vp test --run",
      "test:unit": "vp test --run --project unit",
      "test:browser": "vp test --run --project browser",
      "test:vapor": "vp test --run --project vapor",
      musea: { command: "env DRAGGAVUE_MUSEA=1 vize musea serve", cache: false },
      "musea:build": {
        // The fixup collapses a doubled base prefix in the static
        // output — see scripts/fixMuseaBase.mjs for the upstream bug.
        command: [
          "env DRAGGAVUE_MUSEA=1 vize musea serve --build",
          "node scripts/fixMuseaBase.mjs",
        ],
        cache: false,
      },
      size: "node scripts/size.mjs",
      release: { command: "node scripts/release.mjs", cache: false },
      ready: ["vp check --fix", "vize check", "vize lint src", "vp test --run", "vp run build"],
    },
  },
});
