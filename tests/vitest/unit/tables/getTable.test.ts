// tests/vitest/unit/tables/getTable.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_TABLE_ID_1,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - getTable", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("calls getTable successfully with user token", async () => {
    client = createClient(mockFetch, { debug: true });

    const mockResponse = {
      id: QB_TABLE_ID_1,
      name: "Root",
      alias: "_DBID_ROOT",
      description: "",
      created: new Date("2025-02-13T18:22:33.000Z"),
      updated: new Date("2025-02-13T18:22:34.000Z"),
      nextRecordId: 1,
      nextFieldId: 6,
      defaultSortFieldId: 2,
      defaultSortOrder: "DESC",
      keyFieldId: 3,
      singleRecordName: "Root",
      pluralRecordName: "Roots",
      sizeLimit: "500 MB",
      spaceUsed: "0 KB",
      spaceRemaining: "500 MB",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await client.getTable({
      tableId: QB_TABLE_ID_1,
      appId: QB_APP_ID,
    });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_1}?appId=${QB_APP_ID}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
        }),
      })
    );
  });

  it("calls getTable successfully with temp token", async () => {
    client = createClient(mockFetch, { debug: true, useTempTokens: true });

    const mockResponse = {
      id: QB_TABLE_ID_1,
      name: "Root",
      alias: "_DBID_ROOT",
      description: "",
      created: new Date("2025-02-13T18:22:33.000Z"),
      updated: new Date("2025-02-13T18:22:34.000Z"),
      nextRecordId: 1,
      nextFieldId: 6,
      defaultSortFieldId: 2,
      defaultSortOrder: "DESC",
      keyFieldId: 3,
      singleRecordName: "Root",
      pluralRecordName: "Roots",
      sizeLimit: "500 MB",
      spaceUsed: "0 KB",
      spaceRemaining: "500 MB",
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "temp_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    const response = await client.getTable({
      tableId: QB_TABLE_ID_1,
      appId: QB_APP_ID,
    });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_1}?appId=${QB_APP_ID}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp_token",
        }),
      })
    );
  });

  it("retries successfully after 401 with temp token", async () => {
    client = createClient(mockFetch, { debug: true, useTempTokens: true });

    const mockResponse = {
      id: QB_TABLE_ID_1,
      name: "Root",
      alias: "_DBID_ROOT",
      description: "",
      created: new Date("2025-02-13T18:22:33.000Z"),
      updated: new Date("2025-02-13T18:22:34.000Z"),
      nextRecordId: 1,
      nextFieldId: 6,
      defaultSortFieldId: 2,
      defaultSortOrder: "DESC",
      keyFieldId: 3,
      singleRecordName: "Root",
      pluralRecordName: "Roots",
      sizeLimit: "500 MB",
      spaceUsed: "0 KB",
      spaceRemaining: "500 MB",
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ temporaryAuthorization: "initial_token" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "new_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    const response = await client.getTable({
      tableId: QB_TABLE_ID_1,
      appId: QB_APP_ID,
    });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_1}?appId=${QB_APP_ID}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token",
        }),
      })
    );
  });

  it("handles 401 with failed temp token retry", async () => {
    client = createClient(mockFetch, { debug: true, useTempTokens: true });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ temporaryAuthorization: "initial_token" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({ message: "Unauthorized in fetchTempToken" }),
      });

    await expect(
      client.getTable({ tableId: QB_TABLE_ID_1, appId: QB_APP_ID })
    ).rejects.toThrow(
      "API Error: Unauthorized in fetchTempToken (Status: 401)"
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("handles 404 Not Found", async () => {
    client = createClient(mockFetch, { debug: true });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Table not found" }),
    });

    await expect(
      client.getTable({ tableId: QB_TABLE_ID_1, appId: QB_APP_ID })
    ).rejects.toThrow("API Error: Table not found (Status: 404)");
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_1}?appId=${QB_APP_ID}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
        }),
      })
    );
  });
});
