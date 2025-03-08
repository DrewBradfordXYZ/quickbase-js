import { describe, it, expect } from "vitest";
import { createClient } from "../../../setup.ts";

describe("QuickbaseClient Integration - getApp", () => {
  const client = createClient();

  it(
    "fetches real app data from QuickBase",
    async () => {
      const getAppId = process.env.QB_APP_ID;
      if (!getAppId) throw new Error("QB_APP_ID is not defined in .env");
      if (!process.env.QB_REALM)
        throw new Error("QB_REALM is not defined in .env");
      if (!process.env.QB_USER_TOKEN)
        throw new Error("QB_USER_TOKEN is not defined in .env");

      console.log("Config used:", {
        realm: process.env.QB_REALM,
        userToken: process.env.QB_USER_TOKEN,
        appId: getAppId,
      });
      const result = await client.getApp({ appId: getAppId });
      console.log("Real API response:", result);
      expect(result).toEqual({
        id: getAppId,
        name: "qb-copy",
        created: new Date("2025-02-13T18:22:33Z"),
        updated: new Date("2025-03-04T04:25:51Z"),
        description: "",
        timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
        dateFormat: "MM-DD-YYYY",
        hasEveryoneOnTheInternet: false,
        memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
        securityProperties: {
          allowClone: false,
          allowExport: true,
          enableAppTokens: true,
          hideFromPublic: false,
          mustBeRealmApproved: false,
          useIPFilter: false,
        },
      });
    },
    { timeout: 10000 }
  );
});
