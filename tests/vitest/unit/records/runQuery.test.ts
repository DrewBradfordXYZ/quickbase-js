// tests/vitest/unit/records/runQuery.test.ts
import { describe, test, expect, beforeEach } from "vitest";
import { createClient, mockFetch } from "@tests/setup.ts";
import { RunQueryRequest, RunQueryResponse } from "@/generated";

describe("QuickbaseClient - runQuery (Unit)", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, {
      realm: "test-realm",
      userToken: "test-token",
      debug: true,
    });
  });

  test("sends correct POST request and handles successful query response", async () => {
    const queryRequest: RunQueryRequest = {
      from: "test-table-id",
      select: [3, 6, 7],
      where: "{6.EX.'Task 1'}",
      sortBy: [{ fieldId: 6, order: "ASC" }],
      groupBy: [{ fieldId: 7, grouping: "equal-values" }],
      options: { skip: 0, top: 100, compareWithAppLocalTime: false },
    };

    const mockResponse: RunQueryResponse = {
      data: [
        { "3": { value: 1 }, "6": { value: "Task 1" }, "7": { value: "High" } },
      ],
      fields: [
        { id: 3, label: "Record ID#", type: "recordid" },
        { id: 6, label: "Task Name", type: "text" },
        { id: 7, label: "Priority", type: "text" },
      ],
      metadata: {
        numFields: 3,
        numRecords: 1,
        skip: 0,
        top: 100,
        totalRecords: 1,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    // Note: This will fail until runQuery is added to fix-spec-paths.ts and regenerated
    const result = await client.runQuery({ body: queryRequest });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records/query",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-USER-TOKEN test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(queryRequest),
      })
    );

    expect(result).toEqual(mockResponse);
  });

  test("handles API error with invalid query", async () => {
    const invalidQueryRequest = {
      from: "test-table-id",
      select: [3],
      where: "{999.EX.'Invalid'}", // Invalid field ID
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid query" }),
    });

    await expect(
      client.runQuery({ body: invalidQueryRequest })
    ).rejects.toThrow("API Error: Invalid query (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records/query",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": "test-realm.quickbase.com",
          Authorization: "QB-USER-TOKEN test-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(invalidQueryRequest),
      })
    );
  });
});
