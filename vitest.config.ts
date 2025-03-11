// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv"; // Add this import

// Load .env variables before tests run
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/vitest/**/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"], // Relative path from root
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // For src/ imports
      "@tests": path.resolve(__dirname, "./tests"), // For tests/ imports
    },
  },
});
