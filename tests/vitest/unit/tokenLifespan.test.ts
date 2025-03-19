import { describe, it, expect, beforeEach } from "vitest";
import { createClient, mockFetch, QB_APP_ID, QB_REALM } from "@tests/setup.ts";
import { UpdateAppRequest, UpdateApp200Response } from "@/generated/models";

describe("QuickbaseClient Unit - Token Lifespan", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    console.log("[beforeEach] mockFetch cleared");
  });

  it("reuses token within lifespan and fetches new token after expiration", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      tempTokenLifespan: 500, // 0.5 seconds
      debug: true,
    });

    const request: UpdateAppRequest = { name: "Test App" };
    const mockResponse: UpdateApp200Response = {
      id: QB_APP_ID,
      name: "Test App",
      description: "",
      created: "2020-01-01T00:00:00Z",
      updated: "2020-01-01T00:00:00Z",
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: null,
      variables: [],
      securityProperties: {},
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      dataClassification: "None",
    };

    // First call: Fetch token1 + API call
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
    expect(mockFetch).toHaveBeenCalledTimes(2);
    console.log(
      "[Test 1] After first call, calls:",
      mockFetch.mock.calls.length
    );

    // Second call within lifespan: Reuse token1
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    console.log(
      "[Test 1] After second call, calls:",
      mockFetch.mock.calls.length
    );

    // Wait for token to expire (500ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Third call after expiration: Fetch token2 + API call
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
    expect(mockFetch).toHaveBeenCalledTimes(5);
    console.log(
      "[Test 1] After third call, calls:",
      mockFetch.mock.calls.length
    );
  });

  it("uses default lifespan when not specified", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      debug: true,
    });

    const request: UpdateAppRequest = { name: "Default Lifespan Test" };
    const mockResponse: UpdateApp200Response = {
      id: QB_APP_ID,
      name: "Default Lifespan Test",
      description: "",
      created: "2020-01-01T00:00:00Z",
      updated: "2020-01-01T00:00:00Z",
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: null,
      variables: [],
      securityProperties: {},
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      dataClassification: "None",
    };

    // First call: Fetch token + API call
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
    expect(mockFetch).toHaveBeenCalledTimes(2);
    console.log(
      "[Test 2] After first call, calls:",
      mockFetch.mock.calls.length
    );

    // Second call within default lifespan (1s << 4:50)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    console.log(
      "[Test 2] After second call, calls:",
      mockFetch.mock.calls.length
    );
  });
});
