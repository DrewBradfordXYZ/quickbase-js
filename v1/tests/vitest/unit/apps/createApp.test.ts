// tests/vitest/unit/apps/createApp.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";
import { CreateAppRequest, CreateApp200Response } from "@/generated/models";

describe("QuickbaseClient Unit - createApp", () => {
  console.log(
    "Running updated createApp.test.ts - Version with full request expectation"
  );

  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
  });

  it("has createApp method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(typeof client.createApp).toBe("function");
  });

  it("calls createApp successfully with user token and dates as Date objects", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: CreateAppRequest = {
      name: "New App",
      description: "A new app for testing",
      assignToken: true,
    };

    const mockResponse: CreateApp200Response = {
      id: "new-app-id",
      name: "New App",
      description: "A new app for testing",
      created: new Date("2025-03-11T10:00:00Z"),
      updated: new Date("2025-03-11T10:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      variables: [],
      dataClassification: "None",
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      securityProperties: {
        allowClone: false,
        allowExport: true,
        enableAppTokens: true,
        hideFromPublic: false,
        mustBeRealmApproved: false,
        useIPFilter: false,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.createApp({ body: request });

    expect(result).toEqual(mockResponse);
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body as string);
    console.log("Date objects test - Expected request:", request);
    console.log("Date objects test - Actual body:", body);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: expect.any(String), // Ensure it’s a string, we’ll check content below
        credentials: "omit",
      })
    );
    expect(body).toEqual(request); // Moved outside toHaveBeenCalledWith
  });

  it("calls createApp successfully with user token and dates as strings", async () => {
    client = createClient(mockFetch, { debug: true, convertDates: false });

    const request: CreateAppRequest = {
      name: "New App",
      description: "A new app for testing",
      assignToken: true,
    };

    const mockResponse = {
      id: "new-app-id",
      name: "New App",
      description: "A new app for testing",
      created: "2025-03-11T10:00:00Z",
      updated: "2025-03-11T10:00:00Z",
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      variables: [],
      dataClassification: "None",
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      securityProperties: {
        allowClone: false,
        allowExport: true,
        enableAppTokens: true,
        hideFromPublic: false,
        mustBeRealmApproved: false,
        useIPFilter: false,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.createApp({ body: request });

    expect(result).toEqual(mockResponse);
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body as string);
    console.log("Strings test - Expected request:", request);
    console.log("Strings test - Actual body:", body);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: expect.any(String), // Ensure it’s a string, we’ll check content below
        credentials: "omit",
      })
    );
    expect(body).toEqual(request); // Moved outside toHaveBeenCalledWith
  });

  it("handles 400 error for invalid request", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: CreateAppRequest = {
      name: "",
    };

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Name is required" }),
      })
    );

    await expect(client.createApp({ body: request })).rejects.toThrow(
      "API Error: Name is required (Status: 400)"
    );

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps`,
      expect.objectContaining({
        method: "POST",
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
});
