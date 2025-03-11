// tests/vitest/unit/records/createTable.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - createTable", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("calls createTable successfully with user token", async () => {
    const mockBody = {
      name: "TestTable",
      description: "Unit test table",
      singleRecordName: "Test",
      pluralRecordName: "Tests",
    };
    const mockResponse = {
      id: "newly-created-table-id-1234567890", // Changed from "buya8h9iz"
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

    const response = await client.createTable({
      appId: QB_APP_ID,
      body: mockBody,
    });
    expect(response).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables?appId=${QB_APP_ID}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
        }),
        body: JSON.stringify(mockBody),
      })
    );
  });
});
