// tests/vitest/unit/apps/deleteApp.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";
import { DeleteAppRequest, DeleteApp200Response } from "@/generated/models";

describe("QuickbaseClient Unit - deleteApp", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
  });

  it("has deleteApp method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(typeof client.deleteApp).toBe("function");
  });

  it("calls deleteApp successfully with user token", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: DeleteAppRequest = {
      name: "App to Delete",
    };

    const mockResponse: DeleteApp200Response = {
      deletedAppId: QB_APP_ID,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.deleteApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
      })
    );
  });

  it("calls deleteApp successfully with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: DeleteAppRequest = {
      name: "App to Delete with Temp Token",
    };

    const mockResponse: DeleteApp200Response = {
      deletedAppId: QB_APP_ID,
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

    const result = await client.deleteApp({ appId: QB_APP_ID, body: request });

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
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
      })
    );
  });

  it("retries successfully after 401 with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: DeleteAppRequest = {
      name: "Retry Delete App",
    };

    const mockResponse: DeleteApp200Response = {
      deletedAppId: QB_APP_ID,
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

    const result = await client.deleteApp({ appId: QB_APP_ID, body: request });

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
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN initial_token",
        }),
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
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token",
        }),
      })
    );
  });

  it("handles 400 error for invalid request", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: DeleteAppRequest = {
      name: "Wrong Name",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid application name" }),
    });

    await expect(
      client.deleteApp({ appId: QB_APP_ID, body: request })
    ).rejects.toThrow("API Error: Invalid application name (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
      })
    );
  });
});
