import { describe, it, expect } from "vitest";
import { quickbaseClient } from "../src/quickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config();

describe("QuickbaseClient Integration", () => {
  const client = quickbaseClient({
    realm: process.env.QB_REALM!,
    userToken: process.env.QB_USER_TOKEN!,
    debug: true,
  });

  it(
    "fetches real app data from QuickBase",
    async () => {
      const appId = process.env.QB_APP_ID;
      if (!appId) throw new Error("QB_APP_ID is not defined in .env");
      if (!process.env.QB_REALM)
        throw new Error("QB_REALM is not defined in .env");
      if (!process.env.QB_USER_TOKEN)
        throw new Error("QB_USER_TOKEN is not defined in .env");

      console.log("Config used:", {
        realm: process.env.QB_REALM,
        userToken: process.env.QB_USER_TOKEN,
        appId,
      });
      const result = await client.getApp({ appId });
      console.log("Real API response:", result);
      expect(result).toEqual({
        id: appId,
        name: "qb-copy",
        created: "2025-02-13T18:22:33Z",
        updated: "2025-03-04T04:25:51Z",
        description: "",
        timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
        dateFormat: "MM-DD-YYYY",
        hasEveryoneOnTheInternet: false,
        memoryInfo: {
          estMemory: 0,
          estMemoryInclDependentApps: 0,
        },
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
