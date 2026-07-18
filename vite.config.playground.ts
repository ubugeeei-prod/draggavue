import { fileURLToPath } from "node:url";
import vize from "@vizejs/vite-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig({
  root: "playground",
  plugins: [vize()],
  resolve: {
    alias: {
      draggavue: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
    },
  },
});
