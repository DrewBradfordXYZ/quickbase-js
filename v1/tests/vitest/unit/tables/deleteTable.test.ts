// tests/vitest/unit/records/deleteTable.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_TABLE_ID_1,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - deleteTable", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("calls deleteTable successfully with user token", async () => {
    const mockResponse = {
      deletedTableId: QB_TABLE_ID_1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await client.deleteTable({
      tableId: QB_TABLE_ID_1,
      appId: QB_APP_ID,
    });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_1}?appId=${QB_APP_ID}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
        }),
      })
    );
  });

  it("handles 404 error for non-existent table", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({
          message: "Invalid DBID",
          description: "Table not found in app.",
        }),
    });

    await expect(
      client.deleteTable({ tableId: QB_TABLE_ID_1, appId: QB_APP_ID })
    ).rejects.toThrow("API Error: Invalid DBID (Status: 404)");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_1}?appId=${QB_APP_ID}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
        }),
      })
    );
  });
});
