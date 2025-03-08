// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: true, // Run tests in parallel
  workers: process.env.CI ? 1 : "50%", // Use 50% of CPU cores for local testing
  testDir: "./tests/integration", // Point to your integration tests
  timeout: 30000, // 30 seconds per test
  retries: 2, // Retry flaky tests
  reporter: [["list"], ["json", { outputFile: "test-results.json" }]], // Test output
  use: {
    baseURL: "https://api.quickbase.com",
    headless: true, // Run in headless mode for CI
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000, // 10 seconds per action
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Add more browsers if desired
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
