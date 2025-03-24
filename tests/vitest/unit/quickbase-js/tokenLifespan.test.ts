import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createClient, mockFetch, QB_APP_ID, QB_REALM } from "@tests/setup.ts";
import { UpdateAppRequest, UpdateApp200Response } from "@/generated/models";

describe("QuickbaseClient Unit - Token Lifespan", () => {
  let client: ReturnType<typeof createClient>;
  const request: UpdateAppRequest = { name: "Test App" };
  const mockResponse: UpdateApp200Response = {
    id: QB_APP_ID,
    name: "Test App",
    description: "",
    created: new Date("2020-01-01T00:00:00Z"), // Match deserialized Date object
    updated: new Date("2020-01-01T00:00:00Z"),
    dateFormat: "MM-DD-YYYY",
    timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
    hasEveryoneOnTheInternet: false,
    ancestorId: undefined,
    variables: [],
    securityProperties: {},
    memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
    dataClassification: "None",
  };

  beforeEach(() => {
    mockFetch.mockClear();
    vi.useFakeTimers();
    console.log("[beforeEach] mockFetch cleared and fake timers enabled");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setupMocks = (token: string) => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: token }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });
  };

  it("reuses token within custom lifespan and refetches after expiration", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      tempTokenLifespan: 500,
      debug: true,
    });

    setupMocks("token1");
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe(
      "QB-TEMP-TOKEN token1"
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[2][1].headers.Authorization).toBe(
      "QB-TEMP-TOKEN token1"
    );

    vi.advanceTimersByTime(500);
    console.log("[Test 1] Token expired after 500ms");

    setupMocks("token2");
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(5);
    expect(mockFetch.mock.calls[4][1].headers.Authorization).toBe(
      "QB-TEMP-TOKEN token2"
    );
  });

  it("reuses token within default lifespan of 4m50s", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      debug: true,
    });

    setupMocks("default_token");
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe(
      "QB-TEMP-TOKEN default_token"
    );

    vi.advanceTimersByTime(1000);
    console.log(
      "[Test 2] Advanced time by 1000ms, still within default lifespan"
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[2][1].headers.Authorization).toBe(
      "QB-TEMP-TOKEN default_token"
    );
  });

  it("handles token fetch failure gracefully", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      tempTokenLifespan: 500,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Network error" }),
    });
    await expect(
      client.updateApp({ appId: QB_APP_ID, body: request })
    ).rejects.toThrow("API Error: Network error (Status: 500)");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("fetches new token every call with zero lifespan", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      tempTokenLifespan: 0,
    });

    setupMocks("token1");
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    setupMocks("token2");
    await client.updateApp({ appId: QB_APP_ID, body: request });
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch.mock.calls[3][1].headers.Authorization).toBe(
      "QB-TEMP-TOKEN token2"
    );
  });

  it("reuses token across concurrent calls within lifespan", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      tempTokenLifespan: 500,
      debug: true,
    });

    // Pre-fetch token to ensure it’s cached
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ temporaryAuthorization: "token1" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });
    await client.updateApp({ appId: QB_APP_ID, body: request }); // Cache token1
    vi.advanceTimersByTime(1);

    // Reset mocks and set up API responses
    mockFetch.mockClear();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    const [call1, call2] = await Promise.all([
      client.updateApp({ appId: QB_APP_ID, body: request }),
      client.updateApp({ appId: QB_APP_ID, body: request }),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe(
      "QB-TEMP-TOKEN token1"
    );
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe(
      "QB-TEMP-TOKEN token1"
    );
    expect(call1).toEqual(mockResponse);
    expect(call2).toEqual(mockResponse);
  });
});
