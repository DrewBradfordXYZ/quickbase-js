import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";
import { GetAppEvents200Response } from "@/generated/models";

describe("QuickbaseClient Unit - getAppEvents", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes and has getAppEvents method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
    expect(typeof client.getAppEvents).toBe("function");
  });

  it("fetches app events successfully with user token", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
    });

    const mockResponse: GetAppEvents200Response = [
      {
        type: "qb-action",
        owner: {
          email: "jsmith@quickbase.com",
          id: "123456.ab1s",
          name: "Juliet Smith",
          userName: "jsmith",
        },
        isActive: true,
        tableId: "bqwriv8bw",
        name: "Quick Base Action",
      },
      {
        type: "webhook",
        owner: {
          email: "tanderson@quickbase.com",
          id: "654321.ab1s",
          name: "Thomas A. Anderson",
          userName: "tanderson",
        },
        isActive: false,
        tableId: "bqwriv8bw",
        name: "Webhook",
      },
      {
        type: "email-notification",
        owner: {
          email: "jsmith@quickbase.com",
          id: "123456.ab1s",
          name: "Juliet Smith",
          userName: "jsmith",
        },
        isActive: false,
        tableId: "bqwriv8bw",
        name: "Notification",
      },
      {
        type: "subscription",
        owner: {
          email: "tanderson@quickbase.com",
          id: "654321.ab1s",
          name: "Thomas A. Anderson",
          userName: "tanderson",
        },
        isActive: true,
        tableId: "bqwriv8bw",
        name: "Subscription",
      },
      {
        type: "reminder",
        owner: {
          email: "jsmith@quickbase.com",
          id: "123456.ab1s",
          name: "Juliet Smith",
          userName: "jsmith",
        },
        isActive: true,
        tableId: "bqwriv8bw",
        name: "Reminder",
      },
      {
        type: "automation",
        owner: {
          email: "tanderson@quickbase.com",
          id: "654321.ab1s",
          name: "Thomas A. Anderson",
          userName: "tanderson",
        },
        isActive: true,
        tableId: "bqwriv8bw",
        url: "https://realm.quickbase.com/ui/automation/qb/db/bqwria893/automations/70eecab9-634f-42d9-9037-9340a1a9e8ce",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.getAppEvents({ appId: QB_APP_ID });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/events`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        credentials: "omit",
      })
    );
  });

  it("fetches app events successfully with temp token", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      debug: true,
    });

    const mockResponse: GetAppEvents200Response = [
      {
        type: "webhook",
        owner: {
          email: "tanderson@quickbase.com",
          id: "654321.ab1s",
          name: "Thomas A. Anderson",
          userName: "tanderson",
        },
        isActive: false,
        tableId: "bqwriv8bw",
        name: "Webhook",
      },
    ];

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

    const result = await client.getAppEvents({ appId: QB_APP_ID });

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
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}/events`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
        }),
        credentials: "omit",
      })
    );
  });
});
