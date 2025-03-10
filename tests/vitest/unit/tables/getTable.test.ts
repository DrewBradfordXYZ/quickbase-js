import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch } from "@/tests/setup.ts";

describe("QuickbaseClient - getTable (Unit)", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("calls getTable successfully with user token", async () => {
    const mockAppId = "buwai2zpe";
    const mockTableId = "buwai2zr4";
    const mockResponse = {
      id: mockTableId,
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
      tableId: mockTableId,
      appId: mockAppId,
    });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${mockTableId}?appId=${mockAppId}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
        }),
      })
    );
  });

  it("calls getTable successfully with temp token", async () => {
    client = createClient(mockFetch, { debug: true, useTempTokens: true });
    const mockAppId = "buwai2zpe";
    const mockTableId = "buwai2zr4";
    const mockResponse = {
      id: mockTableId,
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
      tableId: mockTableId,
      appId: mockAppId,
    });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/auth/temporary/${mockTableId}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${mockTableId}?appId=${mockAppId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN temp_token",
        }),
      })
    );
  });

  it("retries successfully after 401 with temp token", async () => {
    client = createClient(mockFetch, { debug: true, useTempTokens: true });
    const mockAppId = "buwai2zpe";
    const mockTableId = "buwai2zr4";
    const mockResponse = {
      id: mockTableId,
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
      tableId: mockTableId,
      appId: mockAppId,
    });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4); // Initial token, 401, retry token, success
  });

  it("handles 401 with failed temp token retry", async () => {
    client = createClient(mockFetch, { debug: true, useTempTokens: true });
    const mockAppId = "buwai2zpe";
    const mockTableId = "buwai2zr4";

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
      client.getTable({ tableId: mockTableId, appId: mockAppId })
    ).rejects.toThrow(
      "API Error: Unauthorized in fetchTempToken (Status: 401)"
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("handles 404 Not Found", async () => {
    const mockAppId = "buwai2zpe";
    const mockTableId = "invalidTableId";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Table not found" }),
    });

    await expect(
      client.getTable({ tableId: mockTableId, appId: mockAppId })
    ).rejects.toThrow("API Error: Table not found (Status: 404)");
  });
});
