// tests/vitest/unit/auth/getTempTokenDBID.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - getTempTokenDBID", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { useTempTokens: true, debug: false });
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has getTempTokenDBID method", () => {
    expect(typeof client.getTempTokenDBID).toBe("function");
  });

  it("fetches and caches temp token on first call", async () => {
    const mockToken = "b123xyz_temp_token";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ temporaryAuthorization: mockToken }),
    });

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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ temporaryAuthorization: mockToken }),
    });

    const firstResult = await client.getTempTokenDBID({ dbid: QB_TABLE_ID_1 });
    expect(firstResult).toEqual({ temporaryAuthorization: mockToken });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockClear();
    const secondResult = await client.getTempTokenDBID({ dbid: QB_TABLE_ID_1 });
    expect(secondResult).toEqual({ temporaryAuthorization: mockToken });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Unauthorized" }),
    });

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
