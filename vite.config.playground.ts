import { fileURLToPath } from "node:url";
import vize from "@vizejs/vite-plugin";
import { defineConfig } from "vite-plus";

const source = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: "playground",
  plugins: [vize()],
  resolve: {
    // Exact aliases first — "draggavue" alone must not swallow the
    // stylesheet specifiers.
    alias: [
      { find: "draggavue/styles.css", replacement: source("./src/styles/index.css") },
      { find: "draggavue/styles/core.css", replacement: source("./src/styles/core.css") },
      { find: "draggavue/styles/lift.css", replacement: source("./src/styles/lift.css") },
      { find: "draggavue", replacement: source("./src/index.ts") },
    ],
  },
});
