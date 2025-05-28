// tests/vitest/qb/auth/ssoTokenConcurrency.test.ts
import { test, expect, vi } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";
import { startMockQuickbaseServer } from "./mockQuickbaseServer";
import { QB_APP_ID, QB_REALM } from "@tests/setup.ts";

test(
  "QuickbaseClient Integration - getApp with SsoTokenStrategy Concurrency",
  async () => {
    const mockServer = startMockQuickbaseServer(3000);

    // Spy on console.log before any actions
    const consoleSpy = vi.spyOn(console, "log");

    try {
      const client = quickbase({
        realm: QB_REALM,
        useSso: true,
        samlToken: "mock-saml-token",
        debug: true,
        baseUrl: "http://localhost:3000/v1",
      });

      const concurrentRequests = [
        client.getApp({ appId: QB_APP_ID }),
        client.getApp({ appId: QB_APP_ID }),
        client.getApp({ appId: QB_APP_ID }),
      ];

      const results = await Promise.all(concurrentRequests);

      expect(results).toHaveLength(3);
      results.forEach((result) =>
        expect(result).toEqual({
          id: QB_APP_ID,
          name: "Mock App",
          created: expect.any(Date),
          updated: expect.any(Date),
        })
      );

      // Verify token fetch and waits using console logs
      const logs = consoleSpy.mock.calls;
      const tokenFetchLogs = logs.filter((call) =>
        call[0].includes("[fetchSsoToken] Fetched token")
      );
      expect(tokenFetchLogs).toHaveLength(1); // Single fetch with synchronization

      const waitLogs = logs.filter((call) =>
        call[0].includes("Waiting for existing SSO fetch")
      );
      expect(waitLogs.length).toBeGreaterThanOrEqual(2); // At least two waits

      const appRequestLogs = logs.filter((call) =>
        call[0].includes("Received getApp request")
      );
      expect(appRequestLogs).toHaveLength(3);

      console.log(
        "SsoTokenStrategy: Single token fetch with concurrent waits confirmed."
      );
    } finally {
      mockServer.close();
      consoleSpy.mockRestore();
    }
  },
  { timeout: 20000 }
);
