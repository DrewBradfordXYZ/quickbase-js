// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const config = defineConfig({
  fullyParallel: true,
  workers: undefined, // Default: half of CPU cores (e.g., 2 on a 4-core machine)
  // workers: 2, // Or explicitly set to 2 for controlled testing
  testDir: "./tests/playwright",
  timeout: 600000, // 10 minutes
  retries: 2,
  reporter: [["list"], ["json", { outputFile: "test-results.json" }]],
  use: {
    baseURL: "https://api.quickbase.com",
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

console.log(
  `Loading Playwright config with timeout: ${config.timeout}ms, workers: ${
    config.workers || "default (half CPU cores)"
  }`
);

export default config;
