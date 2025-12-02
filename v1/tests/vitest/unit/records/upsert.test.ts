// tests/vitest/unit/records/upsert.test.ts
import { describe, expect, test, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { vi } from "vitest";

// Note: Type augmentation moved to src/types.d.ts
describe("QuickbaseClient Unit - upsert", () => {
  beforeEach(() => {
    vi.resetModules(); // Reset module cache
    mockFetch.mockClear();
  });

  test("sends correct POST request and handles successful upsert", async () => {
    const qb = createClient(mockFetch, { debug: true });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [{ id: 1, "6": { value: "value1" } }],
          metadata: {
            createdRecordIds: [1],
            updatedRecordIds: [],
            unchangedRecordIds: [],
            totalNumberOfRecordsProcessed: 1,
          },
        }),
    });

    console.log("[Test] Calling qb.upsert with:", {
      body: { to: QB_TABLE_ID_1, data: [{ "6": { value: "value1" } }] },
    });
    const result = await qb.upsert({
      body: { to: QB_TABLE_ID_1, data: [{ "6": { value: "value1" } }] },
    });

    console.log("[Test] mockFetch calls:", mockFetch.mock.calls);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: expect.any(String), // Allow any string, check content below
        credentials: "omit",
      })
    );
    const callArgs = mockFetch.mock.calls[0];
    const receivedBody = JSON.parse(callArgs[1].body as string);
    expect(receivedBody).toEqual({
      to: QB_TABLE_ID_1,
      data: [{ "6": { value: "value1" } }],
    });

    expect(result).toEqual({
      data: [{ id: 1, "6": { value: "value1" } }],
      metadata: {
        createdRecordIds: [1],
        updatedRecordIds: [],
        unchangedRecordIds: [],
        totalNumberOfRecordsProcessed: 1,
      },
    });
  });

  test("handles API error with invalid data", async () => {
    const qb = createClient(mockFetch, { debug: true });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid data format" }),
    });

    await expect(
      qb.upsert({
        body: { to: QB_TABLE_ID_1, data: [{ "999": { value: "invalid" } }] },
      })
    ).rejects.toThrow("API Error: Invalid data format (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
        credentials: "omit",
      })
    );
    const callArgs = mockFetch.mock.calls[0];
    const receivedBody = JSON.parse(callArgs[1].body as string);
    expect(receivedBody).toEqual({
      to: QB_TABLE_ID_1,
      data: [{ "999": { value: "invalid" } }],
    });
  });

  test("handles upsert with temp token", async () => {
    const qb = createClient(mockFetch, { useTempTokens: true, debug: true });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "temp-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: [{ id: 2, "7": { value: "value2" } }],
            metadata: {
              createdRecordIds: [2],
              updatedRecordIds: [],
              unchangedRecordIds: [],
              totalNumberOfRecordsProcessed: 1,
            },
          }),
      });

    const result = await qb.upsert({
      body: { to: QB_TABLE_ID_1, data: [{ "7": { value: "value2" } }] },
      dbid: QB_TABLE_ID_1, // Use QB_TABLE_ID_1 as dbid for temp token
    } as any); // Temporary type assertion until types.d.ts is applied

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
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
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp-token",
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
        credentials: "omit",
      })
    );
    const callArgs = mockFetch.mock.calls[1];
    const receivedBody = JSON.parse(callArgs[1].body as string);
    expect(receivedBody).toEqual({
      to: QB_TABLE_ID_1,
      data: [{ "7": { value: "value2" } }],
    });

    expect(result).toEqual({
      data: [{ id: 2, "7": { value: "value2" } }],
      metadata: {
        createdRecordIds: [2],
        updatedRecordIds: [],
        unchangedRecordIds: [],
        totalNumberOfRecordsProcessed: 1,
      },
    });
  });

  test("sends correct POST request with data fields", async () => {
    const qb = createClient(mockFetch, { debug: true });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [{ id: 1, "6": { value: "value1" } }],
          metadata: {
            createdRecordIds: [1],
            updatedRecordIds: [],
            unchangedRecordIds: [],
            totalNumberOfRecordsProcessed: 1,
          },
        }),
    });

    const result = await qb.upsert({
      body: { to: QB_TABLE_ID_1, data: [{ "6": { value: "value1" } }] },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
        credentials: "omit",
      })
    );
    const callArgs = mockFetch.mock.calls[0];
    const receivedBody = JSON.parse(callArgs[1].body as string);
    expect(receivedBody).toEqual({
      to: QB_TABLE_ID_1,
      data: [{ "6": { value: "value1" } }],
    });

    if (result.data && result.data.length > 0) {
      expect((result.data[0]["6"] as { value: any }).value).toBe("value1");
    } else {
      throw new Error("Expected data array to have at least one element");
    }
  });
});
