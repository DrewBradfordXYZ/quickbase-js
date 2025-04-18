import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";
import { CopyAppRequest, CopyApp200Response } from "@/generated/models";

describe("QuickbaseClient Unit - copyApp", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
  });

  it("has copyApp method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(typeof client.copyApp).toBe("function");
  });

  it("calls copyApp successfully with user token and dates as Date objects", async () => {
    client = createClient(mockFetch, { debug: true }); // convertDates defaults to true

    const request: CopyAppRequest = {
      name: "Copied App",
      description: "A copy of the original app",
      properties: {
        keepData: false,
        excludeFiles: true,
        usersAndRoles: false,
        assignUserToken: true,
      },
    };

    const mockResponse: CopyApp200Response = {
      id: "bpqe82s1",
      name: "Copied App",
      description: "A copy of the original app",
      created: new Date("2025-03-11T10:00:00Z"),
      updated: new Date("2025-03-11T10:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: "buwai2zpe",
      dataClassification: "None",
      variables: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.copyApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        credentials: "omit",
        body: JSON.stringify(request),
      })
    );
  });

  it("calls copyApp successfully with user token and dates as strings", async () => {
    client = createClient(mockFetch, { debug: true, convertDates: false });

    const request: CopyAppRequest = {
      name: "Copied App",
      description: "A copy of the original app",
      properties: {
        keepData: false,
        excludeFiles: true,
        usersAndRoles: false,
        assignUserToken: true,
      },
    };

    const mockResponse = {
      id: "bpqe82s1",
      name: "Copied App",
      description: "A copy of the original app",
      created: "2025-03-11T10:00:00Z",
      updated: "2025-03-11T10:00:00Z",
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: "buwai2zpe",
      dataClassification: "None",
      variables: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.copyApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        credentials: "omit",
        body: JSON.stringify(request),
      })
    );
  });

  it("calls copyApp successfully with temp token and dates as Date objects", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: CopyAppRequest = {
      name: "Copied App with Temp Token",
      description: "A copy using temp token",
      properties: {
        keepData: true,
        excludeFiles: false,
        usersAndRoles: true,
        assignUserToken: false,
      },
    };

    const mockResponse: CopyApp200Response = {
      id: "bpqe82s2",
      name: "Copied App with Temp Token",
      description: "A copy using temp token",
      created: new Date("2025-03-11T11:00:00Z"),
      updated: new Date("2025-03-11T11:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: true,
      ancestorId: QB_APP_ID,
      dataClassification: "None",
      variables: [],
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

    const result = await client.copyApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN temp_token",
        }),
      })
    );
  });

  it("calls copyApp successfully with temp token and dates as strings", async () => {
    client = createClient(mockFetch, {
      useTempTokens: true,
      debug: true,
      convertDates: false,
    });

    const request: CopyAppRequest = {
      name: "Copied App with Temp Token",
      description: "A copy using temp token",
      properties: {
        keepData: true,
        excludeFiles: false,
        usersAndRoles: true,
        assignUserToken: false,
      },
    };

    const mockResponse = {
      id: "bpqe82s2",
      name: "Copied App with Temp Token",
      description: "A copy using temp token",
      created: "2025-03-11T11:00:00Z",
      updated: "2025-03-11T11:00:00Z",
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: true,
      ancestorId: QB_APP_ID,
      dataClassification: "None",
      variables: [],
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

    const result = await client.copyApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN temp_token",
        }),
      })
    );
  });

  it("retries successfully after 401 with temp token and dates as Date objects", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: CopyAppRequest = {
      name: "Retry Copied App",
      description: "Retry after 401",
      properties: {
        keepData: false,
        excludeFiles: true,
        usersAndRoles: false,
        assignUserToken: true,
      },
    };

    const mockResponse: CopyApp200Response = {
      id: "bpqe82s3",
      name: "Retry Copied App",
      description: "Retry after 401",
      created: new Date("2025-03-11T12:00:00Z"),
      updated: new Date("2025-03-11T12:00:00Z"),
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: QB_APP_ID,
      dataClassification: "None",
      variables: [],
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

    const result = await client.copyApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
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
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token",
        }),
      })
    );
  });

  it("retries successfully after 401 with temp token and dates as strings", async () => {
    client = createClient(mockFetch, {
      useTempTokens: true,
      debug: true,
      convertDates: false,
    });

    const request: CopyAppRequest = {
      name: "Retry Copied App",
      description: "Retry after 401",
      properties: {
        keepData: false,
        excludeFiles: true,
        usersAndRoles: false,
        assignUserToken: true,
      },
    };

    const mockResponse = {
      id: "bpqe82s3",
      name: "Retry Copied App",
      description: "Retry after 401",
      created: "2025-03-11T12:00:00Z",
      updated: "2025-03-11T12:00:00Z",
      dateFormat: "MM-DD-YYYY",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      hasEveryoneOnTheInternet: false,
      ancestorId: QB_APP_ID,
      dataClassification: "None",
      variables: [],
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

    const result = await client.copyApp({ appId: QB_APP_ID, body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
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
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token",
        }),
      })
    );
  });

  it("handles 400 error for invalid request", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: CopyAppRequest = {
      name: "",
      description: "Invalid request",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Name is required" }),
    });

    await expect(
      client.copyApp({ appId: QB_APP_ID, body: request })
    ).rejects.toThrow("API Error: Name is required (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        credentials: "omit",
        body: JSON.stringify(request),
      })
    );
  });

  it("exhausts default maxRetries (3) with temp token and throws error", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true }); // No explicit maxRetries, uses default 3

    const request: CopyAppRequest = {
      name: "Fail App",
      description: "Test retry limit",
      properties: {
        keepData: false,
        excludeFiles: true,
        usersAndRoles: false,
        assignUserToken: true,
      },
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token_1" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized 1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token_2" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized 2" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token_3" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized 3" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token_4" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized 4" }),
      });

    await expect(
      client.copyApp({ appId: QB_APP_ID, body: request })
    ).rejects.toThrow("API Error: Unauthorized 4 (Status: 401)");

    expect(mockFetch).toHaveBeenCalledTimes(8); // 4 token fetches + 4 API attempts
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN token_1",
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
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN token_2",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      5,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      6,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN token_3",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      7,
      `https://api.quickbase.com/v1/auth/temporary/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      8,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/copy`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN token_4",
        }),
      })
    );
  });
});
