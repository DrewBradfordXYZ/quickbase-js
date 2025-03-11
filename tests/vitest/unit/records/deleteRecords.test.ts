// tests/vitest/unit/records/deleteRecords.test.ts
import { describe, expect, test, beforeEach } from "vitest"; // Added 'describe'
import { createClient, mockFetch } from "@tests/setup.ts";

describe("QuickbaseClient - deleteRecords (Unit)", () => {
  beforeEach(() => {
    mockFetch.mockClear(); // Clear mock state between tests
  });

  test("deleteRecords - sends correct DELETE request and handles success", async () => {
    const qb = createClient(mockFetch, {
      realm: "test-realm",
      userToken: "test-token",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ numberDeleted: 1 }),
    });

    const result = await qb.deleteRecords({
      body: {
        from: "test-table-id",
        where: "{3.EX.'5'}", // Simulate deleting Record ID 5
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-USER-TOKEN test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ from: "test-table-id", where: "{3.EX.'5'}" }),
      })
    );
    expect(result).toEqual({ numberDeleted: 1 });
  });

  test("deleteRecords - handles no records deleted", async () => {
    const qb = createClient(mockFetch, {
      realm: "test-realm",
      userToken: "test-token",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ numberDeleted: 0 }),
    });

    const result = await qb.deleteRecords({
      body: {
        from: "test-table-id",
        where: "{3.EX.'999999'}", // Non-existent Record ID
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-USER-TOKEN test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          from: "test-table-id",
          where: "{3.EX.'999999'}",
        }),
      })
    );
    expect(result).toEqual({ numberDeleted: 0 });
  });

  test("deleteRecords - throws error on API failure", async () => {
    const qb = createClient(mockFetch, {
      realm: "test-realm",
      userToken: "test-token",
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid query" }),
    });

    await expect(() =>
      qb.deleteRecords({
        body: {
          from: "test-table-id",
          where: "{3.EX.'invalid'}",
        },
      })
    ).rejects.toThrow("API Error: Invalid query (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-USER-TOKEN test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          from: "test-table-id",
          where: "{3.EX.'invalid'}",
        }),
      })
    );
  });
});
