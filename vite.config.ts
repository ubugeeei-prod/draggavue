import { playwright } from "@vitest/browser-playwright";
import vize from "@vizejs/vite-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [vize()],
  build: {
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
    ignorePatterns: ["dist/**"],
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
      musea: { command: "vize musea serve", cache: false },
      ready: ["vp check --fix", "vize check", "vize lint src", "vp test --run", "vp run build"],
    },
  },
});
