// tests/vitest/qb/auth/userTokenConcurrency.test.ts
import { test, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";

test(
  "QuickbaseClient Integration - getApp with UserToken Concurrency",
  async () => {
    const realm = process.env.QB_REALM || "";
    const appId = process.env.QB_APP_ID || "";
    const userToken = process.env.QB_USER_TOKEN || "";

    if (!realm || !appId || !userToken) {
      throw new Error(
        "QB_REALM, QB_APP_ID, and QB_USER_TOKEN must be set in .env"
      );
    }

    const client = quickbase({
      realm,
      userToken,
      debug: true,
    });

    const concurrentRequests = [
      client.getApp({ appId }),
      client.getApp({ appId }),
      client.getApp({ appId }),
    ];

    const results = await Promise.all(concurrentRequests);

    const expectedAppData = {
      id: appId,
      name: "quickbase-js testing",
      created: expect.any(Date),
      updated: expect.any(Date),
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
      ancestorId: undefined,
      dataClassification: undefined,
      variables: [{ name: "TestVar", value: "TestValue" }],
    };

    expect(results).toHaveLength(3);
    results.forEach((result) => expect(result).toEqual(expectedAppData));

    console.log(
      "UserTokenStrategy: All concurrent requests used static token."
    );
  },
  { timeout: 20000 }
);
