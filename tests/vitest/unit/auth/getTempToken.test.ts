// tests/vitest/unit/auth/getTempToken.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { TokenCache } from "../../../../src/cache/TokenCache"; // Corrected path
import { AuthApi } from "../../../../src/generated/apis/AuthApi";

describe("QuickbaseClient Unit - getTempTokenDBID", () => {
  let client: ReturnType<typeof createClient>;
  let tokenCache: TokenCache;
  let authApi: AuthApi;

  beforeEach(() => {
    mockFetch.mockClear();
    tokenCache = new TokenCache();
    client = createClient(mockFetch, {
      useTempTokens: true,
      debug: true,
      tokenCache,
    });
    authApi = new AuthApi(client["configuration"]);
    vi.spyOn(authApi, "getTempTokenDBIDRaw").mockImplementation(
      async (params) => {
        const mockToken = "b123xyz_temp_token";
        if (params.dbid === QB_TABLE_ID_1) {
          return {
            value: () => Promise.resolve({ temporaryAuthorization: mockToken }),
          } as any;
        }
        throw new Error("Unexpected dbid");
      }
    );
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has getTempTokenDBID method", () => {
    expect(typeof client.getTempTokenDBID).toBe("function");
  });

  it("fetches and caches temp token on first call", async () => {
    const mockToken = "b123xyz_temp_token";

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ temporaryAuthorization: mockToken }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await client.getTempTokenDBID({ dbid: QB_TABLE_ID_1 });
    expect(result).toEqual({ temporaryAuthorization: mockToken });
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
        credentials: "include",
      })
    );
  });

  it("reuses cached temp token on second call", async () => {
    const mockToken = "b123xyz_temp_token";

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ temporaryAuthorization: mockToken }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const firstResult = await client.getTempTokenDBID({ dbid: QB_TABLE_ID_1 });
    expect(firstResult).toEqual({ temporaryAuthorization: mockToken });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockClear();
    const secondResult = await client.getTempTokenDBID({ dbid: QB_TABLE_ID_1 });
    expect(secondResult).toEqual({ temporaryAuthorization: mockToken });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles API error", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      client.getTempTokenDBID({ dbid: QB_TABLE_ID_1 })
    ).rejects.toSatisfy((error: Error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("API Error: Unauthorized (Status: 401)");
      return true;
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
        credentials: "include",
      })
    );
  });
});
