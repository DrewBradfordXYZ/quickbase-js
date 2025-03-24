// tests/vitest/unit/umd.test.ts
import { test, expect } from "vitest";
const quickbaseUMD = require("../../dist/umd/quickbase.umd.js");
const { quickbase: quickbaseESM } = await import("../../dist/esm/quickbase.js");
test("UMD and ESM builds work in Node.js", () => {
  expect(quickbaseUMD).toBeDefined();
  expect(quickbaseESM).toBeDefined();
});
