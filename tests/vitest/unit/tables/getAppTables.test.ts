import { describe, it, expect } from "vitest";
import { createClient, mockFetch } from "@/tests/setup.ts";

describe("QuickbaseClient - getAppTables (Unit)", () => {
  it("calls getAppTables successfully", async () => {
    mockFetch.mockImplementation((url: string, options: any) => {
      console.log("Mock fetch for getAppTables:", url, options);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              alias: "_DBID_ROOT",
              created: "2025-02-13T18:22:33Z",
              defaultSortFieldId: 2,
              defaultSortOrder: "DESC",
              description: "",
              id: "buwai2zr4",
              keyFieldId: 3,
              name: "Root",
              nextFieldId: 6,
              nextRecordId: 1,
              pluralRecordName: "Roots",
              singleRecordName: "Root",
              sizeLimit: "500 MB",
              spaceRemaining: "500 MB",
              spaceUsed: "0 KB",
              updated: "2025-02-13T18:22:34Z",
            },
          ]),
      } as Response);
    });

    const client = createClient(mockFetch);
    const tablesAppId = process.env.QB_APP_ID;
    if (!tablesAppId) throw new Error("QB_APP_ID is not defined in .env");
    const result = await client.getAppTables({ appId: tablesAppId });
    console.log("getAppTables response:", result);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alias: "_DBID_ROOT",
          created: new Date("2025-02-13T18:22:33Z"),
          defaultSortFieldId: 2,
          defaultSortOrder: "DESC",
          description: "",
          id: "buwai2zr4",
          keyFieldId: 3,
          name: "Root",
          nextFieldId: 6,
          nextRecordId: 1,
          pluralRecordName: "Roots",
          singleRecordName: "Root",
          sizeLimit: "500 MB",
          spaceRemaining: "500 MB",
          spaceUsed: "0 KB",
          updated: new Date("2025-02-13T18:22:34Z"),
        }),
      ])
    );
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables?appId=${tablesAppId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
        }),
      })
    );
  });
});
