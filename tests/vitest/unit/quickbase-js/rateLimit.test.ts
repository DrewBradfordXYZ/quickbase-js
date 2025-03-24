// tests/vitest/unit/rateLimit.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";
import { RateLimitError } from "@/RateLimitError";
import { GetApp200Response } from "@/generated/models";

describe("QuickbaseClient Unit - Rate Limit Handling", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("succeeds after retrying on 429 Too Many Requests", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
      maxRetries: 2,
      retryDelay: 100,
      throttle: { rate: 10, burst: 10 },
    });

    const appId = QB_APP_ID;

    const mockResponse: GetApp200Response = {
      id: appId,
      name: "TestApp",
      created: "2025-01-01T00:00:00Z",
      updated: "2025-01-02T00:00:00Z",
      description: "Test app",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      dateFormat: "MM-DD-YYYY",
      hasEveryoneOnTheInternet: false,
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      securityProperties: {
        allowClone: false,
        allowExport: true,
        enableAppTokens: true,
        hideFromPublic: false,
        mustBeRealmApproved: false,
        useIPFilter: false,
      },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "1" }),
        json: () => Promise.resolve({ message: "Too Many Requests" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    const result = await client.getApp({ appId });

    expect(result).toEqual({
      ...mockResponse,
      created: new Date("2025-01-01T00:00:00Z"),
      updated: new Date("2025-01-02T00:00:00Z"),
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/apps/${appId}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        credentials: "omit",
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${appId}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        credentials: "omit",
      })
    );
  });

  it("throws RateLimitError after max retries on 429", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
      maxRetries: 1,
      retryDelay: 100,
      throttle: { rate: 10, burst: 10 },
    });

    const appId = QB_APP_ID;

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "1" }),
        json: () => Promise.resolve({ message: "Too Many Requests" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "1" }),
        json: () => Promise.resolve({ message: "Too Many Requests" }),
      });

    await expect(client.getApp({ appId })).rejects.toMatchObject({
      name: "RateLimitError",
      message: "API Error: Too Many Requests (Status: 429)",
      status: 429,
      retryAfter: 1,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("respects throttle limits without exceeding rate", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
      throttle: { rate: 5, burst: 5 },
      maxRetries: 0, // Prevent retries for this test
    });

    const appId = QB_APP_ID;

    const mockResponse: GetApp200Response = {
      id: appId,
      name: "TestApp",
      created: "2025-01-01T00:00:00Z",
      updated: "2025-01-02T00:00:00Z",
      description: "Test app",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      dateFormat: "MM-DD-YYYY",
      hasEveryoneOnTheInternet: false,
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      securityProperties: {
        allowClone: false,
        allowExport: true,
        enableAppTokens: true,
        hideFromPublic: false,
        mustBeRealmApproved: false,
        useIPFilter: false,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const startTime = Date.now();
    await Promise.all([
      client.getApp({ appId }),
      client.getApp({ appId }),
      client.getApp({ appId }),
      client.getApp({ appId }),
      client.getApp({ appId }),
      client.getApp({ appId }), // 6th call should be throttled
    ]);
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    console.log(`[Test Debug] mockFetch calls: ${mockFetch.mock.calls.length}`);
    expect(mockFetch).toHaveBeenCalledTimes(6);
    expect(durationMs).toBeGreaterThanOrEqual(200); // 1/5 sec for 6th call
    expect(durationMs).toBeLessThan(1000);
  });
});
