// tests/vitest/unit/records/updateTable.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - updateTable", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("calls updateTable successfully with temp token", async () => {
    client = createClient(mockFetch, { debug: true, useTempTokens: true });

    const mockBody = {
      name: "Updated Root",
      description: "Updated description",
    };
    const mockResponse = {
      id: QB_TABLE_ID_1,
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
      tableId: QB_TABLE_ID_1,
      appId: QB_APP_ID,
      body: mockBody,
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
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(mockBody),
      })
    );
  });
});
