import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@botswan/shared": path.resolve(__dirname, "../shared/src/index.ts"),
      "@botswan/artifacts": path.resolve(__dirname, "../artifacts/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});
