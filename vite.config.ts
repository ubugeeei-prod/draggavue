import { playwright } from "@vitest/browser-playwright";
import vize from "@vizejs/vite-plugin";
import musea from "@vizejs/vite-plugin-musea";
import { defineConfig } from "vite-plus";

// The Musea gallery hijacks the build pipeline by design (it emits
// its own entry), so it must never sit in the plugin list of the
// library build. The musea tasks opt in through this flag.
const MUSEA = process.env["DRAGGAVUE_MUSEA"] === "1";

export default defineConfig({
  plugins: MUSEA ? [vize(), musea({ include: ["stories/**/*.art.vue"] })] : [vize()],
  build: MUSEA
    ? {
        outDir: "dist-musea",
      }
    : {
        lib: {
          entry: "src/index.ts",
          formats: ["es"],
          fileName: "index",
        },
        rollupOptions: {
          external: ["vue"],
        },
      },
  test: {
    passWithNoTests: true,
    projects: [
      {
        plugins: [vize()],
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.browser.test.ts"],
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
      build: ["vp build", "tsc -p tsconfig.build.json", "node scripts/copyStyles.mjs"],
      check: ["vp check", "vize check"],
      "check:fmt": "vp check --no-lint",
      "check:oxlint": "vp check --no-fmt",
      typecheck: "vize check",
      fmt: "vp fmt",
      lint: "vize lint src",
      test: "vp test --run",
      "test:unit": "vp test --run --project unit",
      "test:browser": "vp test --run --project browser",
      musea: { command: "env DRAGGAVUE_MUSEA=1 vize musea serve", cache: false },
      "musea:build": { command: "env DRAGGAVUE_MUSEA=1 vize musea serve --build", cache: false },
      size: "node scripts/size.mjs",
      release: { command: "node scripts/release.mjs", cache: false },
      ready: ["vp check --fix", "vize check", "vize lint src", "vp test --run", "vp run build"],
    },
  },
});
