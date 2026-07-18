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
    include: ["src/**/*.test.ts"],
    environment: "node",
    passWithNoTests: true,
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
      build: ["vp build", "tsc -p tsconfig.build.json"],
      check: ["vp check", "vize check"],
      fmt: "vp fmt",
      lint: "vize lint src",
      test: "vp test --run",
      musea: { command: "vize musea serve", cache: false },
      ready: ["vp check --fix", "vize check", "vize lint src", "vp test --run", "vp run build"],
    },
  },
});
