// tests/vitest/unit/records/deleteRecords.test.ts
import { describe, expect, test, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - deleteRecords", () => {
  let qb: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    qb = createClient(mockFetch, { debug: true }); // Use debug: true for consistency with other tests
  });

  test("sends correct DELETE request and handles success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ numberDeleted: 1 }),
    });

    const result = await qb.deleteRecords({
      body: {
        from: QB_TABLE_ID_1,
        where: "{3.EX.'5'}", // Simulate deleting Record ID 5
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ from: QB_TABLE_ID_1, where: "{3.EX.'5'}" }),
      })
    );
    expect(result).toEqual({ numberDeleted: 1 });
  });

  test("handles no records deleted", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ numberDeleted: 0 }),
    });

    const result = await qb.deleteRecords({
      body: {
        from: QB_TABLE_ID_1,
        where: "{3.EX.'999999'}", // Non-existent Record ID
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          from: QB_TABLE_ID_1,
          where: "{3.EX.'999999'}",
        }),
      })
    );
    expect(result).toEqual({ numberDeleted: 0 });
  });

  test("throws error on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid query" }),
    });

    await expect(() =>
      qb.deleteRecords({
        body: {
          from: QB_TABLE_ID_1,
          where: "{3.EX.'invalid'}",
        },
      })
    ).rejects.toThrow("API Error: Invalid query (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          from: QB_TABLE_ID_1,
          where: "{3.EX.'invalid'}",
        }),
      })
    );
  });
});
