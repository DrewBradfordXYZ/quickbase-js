import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom", // Matches your current setup
    include: ["tests/**/*.test.ts"], // Matches all test files
    setupFiles: ["tests/setup.ts"], // Runs setup.ts before tests
  },
});
