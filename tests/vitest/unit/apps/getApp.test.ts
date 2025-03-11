// tests/vitest/unit/apps/getApp.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - getApp", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true }); // Add debug: true for consistency
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
            id: QB_APP_ID,
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

    const result = await client.getApp({ appId: QB_APP_ID });
    expect(result).toEqual({
      id: QB_APP_ID,
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
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
        }),
      })
    );
  });
});
