import { test, expect } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";

test(
  "QuickbaseClient Integration - getApp > fetches real app data from QuickBase",
  { timeout: 10000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "builderprogram-dbradford6815",
      userToken:
        process.env.QB_USER_TOKEN || "b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
      debug: true,
    };
    const client = quickbase(config);
    const getAppId = "buwai2zpe";

    console.log("Config used:", config);
    const result = await client.getApp({ appId: getAppId });
    console.log("Real API response:", result);

    expect(result).toEqual({
      id: getAppId,
      name: "qb-copy",
      created: expect.any(Date), // Matches Date object from client
      updated: expect.any(Date), // Matches Date object from client
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
  }
);
