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
  });

  it("initializes without errors", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
  });

  it("has getApp method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(typeof client.getApp).toBe("function");
  });

  it("calls getApp successfully with dates as Date objects", async () => {
    client = createClient(mockFetch, { debug: true });

    const mockResponse = {
      id: QB_APP_ID,
      name: "qb-copy",
      created: new Date("2025-02-13T18:22:33Z"), // Expect Date object
      updated: new Date("2025-03-04T04:25:51Z"), // Expect Date object
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
      variables: undefined,
      dataClassification: undefined,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.getApp({ appId: QB_APP_ID });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: undefined,
        credentials: "omit",
      })
    );
  });

  it("calls getApp successfully with dates as strings", async () => {
    client = createClient(mockFetch, { debug: true, convertDates: false });

    const mockResponse = {
      id: QB_APP_ID,
      name: "qb-copy",
      created: "2025-02-13T18:22:33Z", // Expect string
      updated: "2025-03-04T04:25:51Z", // Expect string
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
      variables: undefined,
      dataClassification: undefined,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.getApp({ appId: QB_APP_ID });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: undefined,
        credentials: "omit",
      })
    );
  });
});
