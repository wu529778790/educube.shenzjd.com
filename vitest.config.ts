import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "server-only": path.resolve(__dirname, "__tests__/mocks/server-only.ts"),
    },
  },
  test: {
    include: ["__tests__/**/*.test.ts"],
  },
});
