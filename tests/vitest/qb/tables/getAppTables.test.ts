import { test, expect } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";

test(
  "QuickbaseClient Integration - getAppTables > fetches real table data from QuickBase",
  { timeout: 10000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
    };
    const client = quickbase(config);
    const tablesAppId = "buwai2zpe";

    console.log("Config used:", config);
    const result = await client.getAppTables({ appId: tablesAppId });
    console.log("Real API response:", result);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "buwai2zr4",
          alias: "_DBID_ROOT",
          name: expect.any(String), // Allow dynamic name due to updateTable
          description: expect.any(String), // Allow dynamic description
          created: expect.any(Date),
          updated: expect.any(Date), // Allow varying timestamps
          nextRecordId: expect.any(Number),
          nextFieldId: expect.any(Number),
          defaultSortFieldId: expect.any(Number),
          defaultSortOrder: "DESC",
          keyFieldId: expect.any(Number),
          singleRecordName: "Root",
          pluralRecordName: "Roots",
          sizeLimit: "500 MB",
          spaceUsed: expect.any(String),
          spaceRemaining: "500 MB",
        }),
      ])
    );
  }
);
