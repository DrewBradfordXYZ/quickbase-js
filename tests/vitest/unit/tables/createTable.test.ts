import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch } from "@tests/setup.ts";

describe("QuickbaseClient - createTable (Unit)", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("calls createTable successfully with user token", async () => {
    const appId = "buwai2zpe";
    const mockBody = {
      name: "TestTable",
      description: "Unit test table",
      singleRecordName: "Test",
      pluralRecordName: "Tests",
    };
    const mockResponse = {
      id: "buya8h9iz",
      name: "TestTable",
      alias: "_DBID_TESTTABLE",
      description: "Unit test table",
      created: new Date("2025-03-10T21:00:00.000Z"),
      updated: new Date("2025-03-10T21:00:00.000Z"),
      nextRecordId: 1,
      nextFieldId: 6,
      defaultSortFieldId: 2,
      defaultSortOrder: "DESC",
      keyFieldId: 3,
      singleRecordName: "Test",
      pluralRecordName: "Tests",
      sizeLimit: "500 MB",
      spaceUsed: "0 KB",
      spaceRemaining: "500 MB",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const response = await client.createTable({ appId, body: mockBody });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables?appId=${appId}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": "builderprogram-dbradford6815.quickbase.com",
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
        }),
        body: JSON.stringify(mockBody),
      })
    );
  });
});
