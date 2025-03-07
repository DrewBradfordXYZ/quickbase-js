import { describe, it, expect } from "vitest";
import { createClient } from "../../setup.ts";

describe("QuickbaseClient Integration - getAppTables", () => {
  const client = createClient();

  it(
    "fetches real table data from QuickBase",
    async () => {
      const tablesAppId = process.env.QB_APP_ID;
      if (!tablesAppId) throw new Error("QB_APP_ID is not defined in .env");
      if (!process.env.QB_REALM)
        throw new Error("QB_REALM is not defined in .env");
      if (!process.env.QB_USER_TOKEN)
        throw new Error("QB_USER_TOKEN is not defined in .env");

      console.log("Config used:", {
        realm: process.env.QB_REALM,
        userToken: process.env.QB_USER_TOKEN,
        appId: tablesAppId,
      });
      const result = await client.getAppTables({ appId: tablesAppId });
      console.log("Real API response:", result);
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
          expect.objectContaining({
            alias: "_DBID_ROLES",
            created: new Date("2025-02-13T18:22:33Z"),
            defaultSortFieldId: 2,
            defaultSortOrder: "DESC",
            description: "",
            id: "buwai2z3s",
            keyFieldId: 3,
            name: "Roles",
            nextFieldId: 6,
            nextRecordId: 1,
            pluralRecordName: "Roles",
            singleRecordName: "Role",
            sizeLimit: "500 MB",
            spaceRemaining: "500 MB",
            spaceUsed: "0 KB",
            updated: new Date("2025-02-13T18:22:34Z"),
          }),
        ])
      );
    },
    { timeout: 10000 }
  );
});
