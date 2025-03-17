// tests/vitest/unit/apps/updateApp.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";
import { UpdateAppRequest, UpdateApp200Response } from "@/generated/models";

describe("QuickbaseClient Unit - updateApp", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors and has updateApp method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
    expect(typeof client.updateApp).toBe("function");
  });

  it("updates app successfully with user token and dates as Date objects", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: UpdateAppRequest = {
      name: "Updated Testing App",
      description: "Updated description",
      variables: [
        { name: "Project End Date", value: "7-16-2025" },
        { name: "Project Manager Email", value: "p.diaz@company.com" },
      ],
      securityProperties: {
        allowClone: true,
        allowExport: true,
        enableAppTokens: true,
        hideFromPublic: true,
        mustBeRealmApproved: false,
        useIPFilter: false,
      },
    };

    const mockResponse: UpdateApp200Response = {
      id: QB_APP_ID,
      name: "Updated Testing App",
      description: "Updated description",
      created: new Date("2020-03-27T18:34:12Z"),
      updated: new Date("2025-03-17T12:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: true,
      ancestorId: "bqhskthaq",
      variables: request.variables,
      securityProperties: request.securityProperties,
      memoryInfo: { estMemory: 1, estMemoryInclDependentApps: 2 },
      dataClassification: "Confidential",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.updateApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "POST", // Adjusted to POST per your implementation
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
        credentials: "omit",
      })
    );
  });

  it("updates app successfully with temp token and dates as strings", async () => {
    client = createClient(mockFetch, {
      useTempTokens: true,
      debug: true,
      convertDates: false,
    });

    const request: UpdateAppRequest = {
      name: "Updated Temp App",
      description: "Temp token update",
      variables: [{ name: "Var1", value: "Value1" }],
    };

    const mockResponse = {
      id: QB_APP_ID,
      name: "Updated Temp App",
      description: "Temp token update",
      created: "2020-03-27T18:34:12Z",
      updated: "2025-03-17T12:00:00Z",
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: "bqhskthaq",
      variables: request.variables,
      securityProperties: {
        allowClone: false,
        allowExport: false,
        enableAppTokens: false,
        hideFromPublic: false,
        mustBeRealmApproved: true,
        useIPFilter: true,
      },
      memoryInfo: { estMemory: 1, estMemoryInclDependentApps: 2 },
      dataClassification: "None",
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "temp_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    const result = await client.updateApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
        credentials: "include",
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "POST", // Adjusted to POST
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
        credentials: "omit",
      })
    );
  });

  it("retries successfully after 401 with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: UpdateAppRequest = {
      name: "Retry Update App",
      description: "Retry after 401",
    };

    const mockResponse: UpdateApp200Response = {
      id: QB_APP_ID,
      name: "Retry Update App",
      description: "Retry after 401",
      created: new Date("2020-03-27T18:34:12Z"),
      updated: new Date("2025-03-17T12:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: "bqhskthaq",
      variables: [],
      securityProperties: {
        allowClone: false,
        allowExport: false,
        enableAppTokens: false,
        hideFromPublic: false,
        mustBeRealmApproved: true,
        useIPFilter: true,
      },
      memoryInfo: { estMemory: 1, estMemoryInclDependentApps: 2 },
      dataClassification: "Confidential",
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ temporaryAuthorization: "initial_token" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "new_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    const consoleSpy = vi.spyOn(console, "log");
    const result = await client.updateApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "POST", // Adjusted to POST
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN initial_token",
        }),
        body: JSON.stringify(request),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "POST", // Adjusted to POST
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token",
        }),
        body: JSON.stringify(request),
      })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for updateApp, refreshing token:",
      expect.any(String)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Retrying updateApp with new token"
    );
    consoleSpy.mockRestore();
  });

  it("handles 400 error for invalid request", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: UpdateAppRequest = {
      name: "", // Invalid: empty name
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Name is required" }),
    });

    await expect(
      client.updateApp({ appId: QB_APP_ID, body: request })
    ).rejects.toThrow("API Error: Name is required (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "POST", // Adjusted to POST
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
        credentials: "omit",
      })
    );
  });

  it("handles edge case with more than 10 variables", async () => {
    client = createClient(mockFetch, { debug: true });

    const tooManyVariables = Array(11)
      .fill(null)
      .map((_, i) => ({ name: `Var${i}`, value: `Value${i}` }));
    const request: UpdateAppRequest = {
      name: "Test App",
      variables: tooManyVariables,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ message: "Maximum of 10 variables allowed" }),
    });

    await expect(
      client.updateApp({ appId: QB_APP_ID, body: request })
    ).rejects.toThrow(
      "API Error: Maximum of 10 variables allowed (Status: 400)"
    );

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "POST", // Adjusted to POST
        body: JSON.stringify(request),
      })
    );
  });

  it("handles empty variables and security properties", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: UpdateAppRequest = {
      name: "Empty Test App",
      variables: [],
      securityProperties: {},
    };

    const mockResponse: UpdateApp200Response = {
      id: QB_APP_ID,
      name: "Empty Test App",
      description: "",
      created: new Date("2020-03-27T18:34:12Z"),
      updated: new Date("2025-03-17T12:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: true,
      ancestorId: "bqhskthaq",
      variables: [],
      securityProperties: {
        allowClone: false,
        allowExport: false,
        enableAppTokens: false,
        hideFromPublic: false,
        mustBeRealmApproved: true,
        useIPFilter: true,
      },
      memoryInfo: { estMemory: 1, estMemoryInclDependentApps: 2 },
      dataClassification: "Confidential",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.updateApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(result.variables).toEqual([]);
    expect(result.securityProperties).toBeDefined();
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "POST", // Adjusted to POST
        body: JSON.stringify(request),
      })
    );
  });
});
