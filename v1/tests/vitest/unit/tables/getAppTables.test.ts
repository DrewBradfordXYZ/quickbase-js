// tests/vitest/unit/tables/getAppTables.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - getAppTables", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true }); // Add debug: true for consistency
  });

  it("calls getAppTables successfully", async () => {
    mockFetch.mockImplementation((url: string, options: any) => {
      console.log("Mock fetch for getAppTables:", url, options);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              id: "buwai2zr4",
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
            },
          ]),
      } as Response);
    });

    const result = await client.getAppTables({ appId: QB_APP_ID });
    console.log("getAppTables response:", result);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "buwai2zr4",
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
        }),
      ])
    );
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables?appId=${QB_APP_ID}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
      })
    );
  });
});
