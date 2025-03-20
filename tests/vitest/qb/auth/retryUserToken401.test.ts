import { describe, it, vi, expect, beforeEach } from "vitest";
import { quickbase, QuickbaseClient } from "../../../../src/quickbaseClient";

describe("QuickbaseClient Integration - User Token Retry on 401", () => {
  let client: QuickbaseClient;

  beforeEach(() => {
    const userToken = process.env.QB_USER_TOKEN;
    const realm = process.env.QB_REALM;
    const tableId = process.env.QB_TABLE_ID_1; // Consistent env var name

    if (!userToken) {
      throw new Error(
        "QB_USER_TOKEN environment variable is required for integration test"
      );
    }
    if (!tableId) {
      throw new Error(
        "QB_TABLE_ID_1 environment variable is required for integration test"
      );
    }

    const config = {
      realm,
      userToken,
      debug: true,
    };
    console.log("[quickbaseTest] Config:", {
      realm,
      userToken: userToken.substring(0, 10) + "...",
      tableId, // Log to confirm
      debug: true,
    });
    client = quickbase(config);
  });

  it(
    "successfully retrieves fields with user token, retrying on transient 401 if needed",
    async () => {
      const consoleSpy = vi.spyOn(console, "log");

      const tableId = process.env.QB_TABLE_ID_1!; // Match beforeEach
      let fields;
      try {
        fields = await client.getFields({ tableId });
      } catch (error) {
        console.error("[integrationTest] Failed to retrieve fields:", error);
        throw error;
      }

      expect(fields).toBeInstanceOf(Array);
      expect(fields.length).toBeGreaterThan(0);
      expect(fields[0]).toHaveProperty("id");
      expect(fields[0]).toHaveProperty("label");

      console.log("[integrationTest] Fields retrieved:", fields.length);

      const retryLog = consoleSpy.mock.calls.some((call) =>
        call[0].includes("Retrying getFields with existing user token")
      );
      if (retryLog) {
        console.log("[integrationTest] Retry on 401 detected");
      } else {
        console.log(
          "[integrationTest] No 401 retries observed (expected if no transient failure)"
        );
      }

      consoleSpy.mockRestore();
    },
    { timeout: 10000 }
  );
});
