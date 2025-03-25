import { describe, test, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { RunQueryRequest, RunQuery200Response } from "@/generated";

describe("QuickbaseClient Unit - runQuery", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  test("sends correct POST request and handles successful query response", async () => {
    const queryRequest: RunQueryRequest = {
      from: QB_TABLE_ID_1,
      select: [3, 6, 7],
      where: "{6.EX.'Task 1'}",
      sortBy: [{ fieldId: 6, order: "ASC" }],
      groupBy: [{ fieldId: 7, grouping: "equal-values" }],
      options: { skip: 0, top: 100, compareWithAppLocalTime: false },
    };

    const mockResponse: RunQuery200Response = {
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
        // top is omitted or undefined in the final response unless pagination continues
        totalRecords: 1,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.runQuery({ body: queryRequest });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/records/query",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(queryRequest),
      })
    );

    expect(result).toEqual(mockResponse);
  });

  test("handles API error with invalid query", async () => {
    const invalidQueryRequest: RunQueryRequest = {
      from: QB_TABLE_ID_1,
      select: [3],
      where: "{999.EX.'Invalid'}",
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
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(invalidQueryRequest),
      })
    );
  });
});
