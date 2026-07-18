import { defineConfig } from "vize";

export default defineConfig({
  linter: {
    preset: "happy-path",
    typeAware: true,
    categories: {
      correctness: "error",
      suspicious: "error",
      perf: "error",
      a11y: "error",
      security: "error",
    },
  },
});
