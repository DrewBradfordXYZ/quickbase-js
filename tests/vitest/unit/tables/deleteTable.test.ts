import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch } from "@/tests/setup.ts";

describe("QuickbaseClient - deleteTable (Unit)", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("calls deleteTable successfully with user token", async () => {
    const appId = "buwai2zpe";
    const tableId = "buya8h9iz";
    const mockResponse = {
      deletedTableId: tableId,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await client.deleteTable({ tableId, appId });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${tableId}?appId=${appId}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": "builderprogram-dbradford6815.quickbase.com",
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
        }),
      })
    );
  });

  it("handles 404 error for non-existent table", async () => {
    const appId = "buwai2zpe";
    const tableId = "nonexistent";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({
          message: "Invalid DBID",
          description: "Table not found in app.",
        }),
    });

    await expect(client.deleteTable({ tableId, appId })).rejects.toThrow(
      "API Error: Invalid DBID (Status: 404)"
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${tableId}?appId=${appId}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.any(Object),
      })
    );
  });
});
