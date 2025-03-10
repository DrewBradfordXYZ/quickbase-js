import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch } from "@/tests/setup.ts";

describe("QuickbaseClient - updateTable (Unit)", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("calls updateTable successfully with temp token", async () => {
    client = createClient(mockFetch, { debug: true, useTempTokens: true });
    const mockAppId = "buwai2zpe";
    const mockTableId = "buwai2zr4";
    const mockBody = {
      name: "Updated Root",
      description: "Updated description",
    };
    const mockResponse = {
      id: mockTableId,
      name: "Updated Root",
      alias: "_DBID_ROOT",
      description: "Updated description",
      created: new Date("2025-02-13T18:22:33.000Z"),
      updated: new Date("2025-03-10T12:00:00.000Z"),
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

    const response = await client.updateTable({
      tableId: mockTableId,
      appId: mockAppId,
      body: mockBody,
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
        method: "POST", // Updated to match QuickBase API spec
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(mockBody),
      })
    );
  });
});
