// tests/vitest/unit/records/upsert.test.ts
import { describe, expect, test, beforeEach } from "vitest";
import { createClient, mockFetch } from "@tests/setup.ts";
import { vi } from "vitest";

// Note: Type augmentation moved to src/types.d.ts
describe("QuickbaseClient - upsert (Unit)", () => {
  beforeEach(() => {
    vi.resetModules(); // Reset module cache
    mockFetch.mockClear();
  });

  test("sends correct POST request and handles successful upsert", async () => {
    const qb = createClient(mockFetch, {
      realm: "test-realm",
      userToken: "test-token",
      debug: true,
    });

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
      body: { to: "test-table-id", data: [{ "6": { value: "value1" } }] },
    });
    const result = await qb.upsert({
      body: { to: "test-table-id", data: [{ "6": { value: "value1" } }] },
    });

    console.log("[Test] mockFetch calls:", mockFetch.mock.calls);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-USER-TOKEN test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          to: "test-table-id",
          data: [{ "6": { value: "value1" } }],
        }),
      })
    );

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
    const qb = createClient(mockFetch, {
      realm: "test-realm",
      userToken: "test-token",
      debug: true,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid data format" }),
    });

    await expect(
      qb.upsert({
        body: { to: "test-table-id", data: [{ "999": { value: "invalid" } }] },
      })
    ).rejects.toThrow("API Error: Invalid data format (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-USER-TOKEN test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          to: "test-table-id",
          data: [{ "999": { value: "invalid" } }],
        }),
      })
    );
  });

  test("handles upsert with temp token", async () => {
    const qb = createClient(mockFetch, {
      realm: "test-realm",
      useTempTokens: true,
      debug: true,
    });

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
      body: { to: "test-table-id", data: [{ "7": { value: "value2" } }] },
      dbid: "test-dbid",
    } as any); // Temporary type assertion until types.d.ts is applied

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://api.quickbase.com/v1/auth/temporary/test-dbid",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
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
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-TEMP-TOKEN temp-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          to: "test-table-id",
          data: [{ "7": { value: "value2" } }],
        }),
      })
    );

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
    const qb = createClient(mockFetch, {
      realm: "test-realm",
      userToken: "test-token",
      debug: true,
    });

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
      body: { to: "test-table-id", data: [{ "6": { value: "value1" } }] },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-USER-TOKEN test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          to: "test-table-id",
          data: [{ "6": { value: "value1" } }],
        }),
      })
    );

    if (result.data && result.data.length > 0) {
      expect((result.data[0]["6"] as { value: any }).value).toBe("value1");
    } else {
      throw new Error("Expected data array to have at least one element");
    }
  });
});
