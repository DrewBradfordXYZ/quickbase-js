// tests/playwright/qb/auth/umd.test.ts
import { test, expect } from "@playwright/test";
test("UMD build works in browser", async ({ page }) => {
  await page.goto("http://localhost:3000/test-umd.html");
  const result = await page.evaluate(() => {
    const qb = new QuickbaseJS({ realm: "example", useTempTokens: true });
    return qb.getTempTokenDBID({ dbid: "test-dbid" });
  });
  expect(result).toBeTruthy();
});
