import { describe, it, expect, beforeEach } from "vitest";
import { createClient, mockFetch } from "@tests/setup.ts";

describe("QuickbaseClient - getApp (Unit)", () => {
  const client = createClient(mockFetch);

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has getApp method", () => {
    expect(typeof client.getApp).toBe("function");
  });

  it("calls getApp successfully", async () => {
    mockFetch.mockImplementation((url: string, options: any) => {
      console.log("Mock fetch:", url, options);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: process.env.QB_APP_ID,
            name: "qb-copy",
            created: "2025-02-13T18:22:33Z",
            updated: "2025-03-04T04:25:51Z",
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
          }),
      } as Response);
    });

    const getAppId = process.env.QB_APP_ID;
    if (!getAppId) throw new Error("QB_APP_ID is not defined in .env");
    console.log("Test appId:", getAppId);
    const result = await client.getApp({ appId: getAppId });
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
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${getAppId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
        }),
      })
    );
  });
});
