// tests/vitest/unit/apps/getAppConcurrency.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch, QB_APP_ID, QB_REALM } from "@tests/setup.ts";

describe("QuickbaseClient Unit - getApp Concurrency with Temp Tokens", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    // Reset client before each test
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true, // Use TempTokenStrategy
      debug: true,
    });
  });

  it("handles concurrent getApp requests with a single token fetch", async () => {
    // Mock the token fetch response
    const tempTokenResponse = {
      temporaryAuthorization: "temp-token-123",
    };
    mockFetch.mockImplementation((url: string, options: RequestInit) => {
      if (url.includes(`/auth/temporary/${QB_APP_ID}`)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(tempTokenResponse),
        });
      }
      // Mock the getApp response
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: QB_APP_ID,
            name: "test-app",
            created: "2025-02-13T18:22:33Z",
            updated: "2025-03-04T04:25:51Z",
          }),
      });
    });

    // Simulate concurrent getApp requests
    const concurrentRequests = [
      client.getApp({ appId: QB_APP_ID }),
      client.getApp({ appId: QB_APP_ID }),
      client.getApp({ appId: QB_APP_ID }),
    ];

    const results = await Promise.all(concurrentRequests);

    // Assertions
    expect(results).toHaveLength(3); // All requests completed
    results.forEach((result) => {
      expect(result).toEqual({
        id: QB_APP_ID,
        name: "test-app",
        created: expect.any(Date), // Assuming convertDates is true
        updated: expect.any(Date),
      });
    });

    // Verify token fetch was called exactly once
    const tokenFetchCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes(`/auth/temporary/${QB_APP_ID}`)
    );
    expect(tokenFetchCalls).toHaveLength(1); // Only one token fetch despite 3 requests

    // Verify getApp calls were made with the temp token
    const getAppCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes(`/apps/${QB_APP_ID}`)
    );
    expect(getAppCalls).toHaveLength(3); // Three getApp requests
    getAppCalls.forEach((call) => {
      expect(call[1].headers).toMatchObject({
        Authorization: `QB-TEMP-TOKEN ${tempTokenResponse.temporaryAuthorization}`,
        "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
        "Content-Type": "application/json",
      });
    });
  });

  it("handles concurrent getApp requests with cached token", async () => {
    // Pre-populate the token cache by making an initial request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({ temporaryAuthorization: "cached-token-456" }),
    });
    await client.getApp({ appId: QB_APP_ID }); // This caches the token

    // Reset mock to clear initial call tracking
    mockFetch.mockClear();

    // Mock only the getApp response now (no token fetch needed)
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: QB_APP_ID,
          name: "test-app",
          created: "2025-02-13T18:22:33Z",
          updated: "2025-03-04T04:25:51Z",
        }),
    });

    // Simulate concurrent getApp requests with cached token
    const concurrentRequests = [
      client.getApp({ appId: QB_APP_ID }),
      client.getApp({ appId: QB_APP_ID }),
      client.getApp({ appId: QB_APP_ID }),
    ];

    const results = await Promise.all(concurrentRequests);

    // Assertions
    expect(results).toHaveLength(3); // All requests completed
    results.forEach((result) => {
      expect(result).toEqual({
        id: QB_APP_ID,
        name: "test-app",
        created: expect.any(Date),
        updated: expect.any(Date),
      });
    });

    // Verify no token fetches occurred (cache was used)
    const tokenFetchCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes(`/auth/temporary/${QB_APP_ID}`)
    );
    expect(tokenFetchCalls).toHaveLength(0); // No token fetches

    // Verify getApp calls were made with the cached token
    const getAppCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes(`/apps/${QB_APP_ID}`)
    );
    expect(getAppCalls).toHaveLength(3); // Three getApp requests
    getAppCalls.forEach((call) => {
      expect(call[1].headers).toMatchObject({
        Authorization: `QB-TEMP-TOKEN cached-token-456`,
        "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
        "Content-Type": "application/json",
      });
    });
  });
});
