import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/vitest/**/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
