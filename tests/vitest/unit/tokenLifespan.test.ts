import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch, QB_APP_ID, QB_REALM } from "@tests/setup.ts";
import { UpdateAppRequest, UpdateApp200Response } from "@/generated/models";

describe("QuickbaseClient Unit - Token Lifespan", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("reuses token within lifespan and fetches new token after expiration", async () => {
    // Set a short lifespan of 500ms for testing
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      tokenLifespan: 500, // 0.5 seconds
      debug: true,
    });

    const request: UpdateAppRequest = {
      name: "Test App",
    };
    const mockResponse: UpdateApp200Response = {
      id: QB_APP_ID,
      name: "Test App",
      description: "",
      created: new Date("2020-01-01T00:00:00Z"),
      updated: new Date("2020-01-01T00:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: null,
      variables: [],
      securityProperties: {},
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      dataClassification: "None",
    };

    // First call: Fetch a new token
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(2); // Token fetch + API call

    // Second call within lifespan: Should reuse token1
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(3); // Only API call, no new token fetch

    // Wait for token to expire (500ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Third call after expiration: Should fetch a new token
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token2" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(5); // New token fetch + API call
  });

  it("uses default lifespan when not specified", async () => {
    // No tokenLifespan provided, should use default (4:50 = 290,000ms)
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      debug: true,
    });

    const request: UpdateAppRequest = {
      name: "Default Lifespan Test",
    };
    const mockResponse: UpdateApp200Response = {
      id: QB_APP_ID,
      name: "Default Lifespan Test",
      description: "",
      created: new Date("2020-01-01T00:00:00Z"),
      updated: new Date("2020-01-01T00:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: null,
      variables: [],
      securityProperties: {},
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      dataClassification: "None",
    };

    // First call: Fetch a new token
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ temporaryAuthorization: "default_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(2); // Token fetch + API call

    // Second call within default lifespan (e.g., after 1 second, well below 4:50)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(3); // No new token fetch, still within 4:50
  });
});
