// /home/drew/Projects/quickbase-js/playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

console.log("Loading Playwright config with timeout: 310000ms, workers: 1");

export default defineConfig({
  fullyParallel: false, // Disable parallelism for now
  workers: 1,
  testDir: "./tests/playwright",
  timeout: 310000, // 5 minutes 10 seconds
  retries: 1, // Reduced from 2
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
