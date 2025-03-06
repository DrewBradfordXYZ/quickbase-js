import { describe, it, expect, vi, beforeEach } from "vitest";
import { quickbaseClient } from "../src/quickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config();

describe("QuickbaseClient", () => {
  const mockFetch = vi.fn((url, options) => {
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
        }),
    } as Response);
  });

  const client = quickbaseClient({
    realm: process.env.QB_REALM || "default-realm",
    userToken: process.env.QB_USER_TOKEN || "default-token",
    debug: true,
    fetchApi: mockFetch,
  });

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
    const appId = process.env.QB_APP_ID;
    if (!appId) throw new Error("QB_APP_ID is not defined in .env");
    console.log("Test appId:", appId);
    const result = await client.getApp({ appId });
    expect(result).toEqual({
      id: appId,
      name: "qb-copy",
      created: new Date("2025-02-13T18:22:33Z"),
      updated: new Date("2025-03-04T04:25:51Z"),
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
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${appId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
        }),
      })
    );
  });
});
