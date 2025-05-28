// tests/vitest/qb/auth/ssoTokenIntegrationWithServer.test.ts

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"; // Add 'vi' to imports
import { quickbase } from "../../../../src/client/quickbaseClient";
import { startMockQuickbaseServer } from "./mockQuickbaseServer";

describe("QuickbaseClient Integration - SSO with Mock Server", () => {
  let mockServer: ReturnType<typeof startMockQuickbaseServer>;
  const mockBaseUrl = "http://localhost:3000";

  beforeAll(async () => {
    mockServer = startMockQuickbaseServer(3000);
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Server setup complete, port 3000 should be listening");
  });

  afterAll(() => {
    mockServer.close();
    console.log("Server closed");
  });

  it(
    "uses SSO token from mock server and retries on 401",
    { timeout: 10000 }, // Move timeout to second argument
    async () => {
      const consoleSpy = vi.spyOn(console, "log"); // Spy on console.log to capture logs
      const client = quickbase({
        realm: "testrealm",
        samlToken: "mock-saml-token",
        useSso: true,
        fetchApi: (url, options) => {
          const rewrittenUrl = url.replace(
            "https://api.quickbase.com/v1",
            mockBaseUrl + "/v1"
          );
          console.log(
            "[fetchApi] Requesting:",
            rewrittenUrl,
            "Options:",
            options
          );
          return fetch(rewrittenUrl, options);
        },
        debug: true,
      });

      await mockServer.toggleFail();
      const response = await client.getApp({ appId: "mockappid" });

      expect(response).toBeDefined();
      expect(response.id).toBe("mockappid");
      expect(response.name).toBe("Mock App");

      // Verify retry happened
      const retryLog = consoleSpy.mock.calls.some((call) =>
        call[0].includes(
          "Authorization error for getApp (SSO), refreshing token"
        )
      );
      expect(retryLog).toBe(true); // Ensure retry logic was triggered

      consoleSpy.mockRestore();
    }
  );
});
