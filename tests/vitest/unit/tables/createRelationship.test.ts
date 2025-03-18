import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_TABLE_ID_1,
  QB_TABLE_ID_2,
} from "@tests/setup.ts";
import {
  CreateRelationship200Response,
  CreateRelationshipRequest,
} from "/home/drew/Projects/quickbase-js/src/generated/models";

describe("QuickbaseClient Unit - createRelationship", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has createRelationship method", () => {
    expect(typeof client.createRelationship).toBe("function");
  });

  it("sends correct request and handles successful response", async () => {
    const mockResponse: CreateRelationship200Response = {
      id: 6,
      foreignKeyField: {
        id: 6,
        label: "my relationship field",
        type: "numeric",
      },
      lookupFields: [
        { id: 7, label: "Field 1", type: "text" },
        { id: 8, label: "Field 2", type: "text" },
        { id: 9, label: "Field 3", type: "text" },
      ],
      isCrossApp: false,
      parentTableId: QB_TABLE_ID_1,
      childTableId: QB_TABLE_ID_2,
      summaryFields: [
        { id: 10, label: "my first summary field", type: "numeric" },
        { id: 11, label: "my second summary field", type: "numeric" },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const requestBody: CreateRelationshipRequest = {
      parentTableId: QB_TABLE_ID_1,
      foreignKeyField: { label: "my relationship field" },
      lookupFieldIds: [1, 2, 3],
      summaryFields: [
        {
          summaryFid: 3,
          label: "my first summary field",
          accumulationType: "AVG",
          where: "{'3'.EX.1}",
        },
        {
          summaryFid: 4,
          label: "my second summary field",
          accumulationType: "SUM",
        },
      ],
    };

    const tableId = QB_TABLE_ID_2;

    const result = await client.createRelationship({
      tableId,
      body: requestBody,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationship`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": "builderprogram-dbradford6815.quickbase.com",
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
        }),
        body: JSON.stringify(requestBody),
      })
    );
    expect(result).toEqual(mockResponse);
    expect(result.id).toBe(6);
    expect(result.parentTableId).toBe(QB_TABLE_ID_1);
    expect(result.childTableId).toBe(QB_TABLE_ID_2);
    expect(result.foreignKeyField).toBeDefined();
    if (result.foreignKeyField) {
      expect(result.foreignKeyField.label).toBe("my relationship field");
    }
    expect(result.lookupFields).toHaveLength(3);
    expect(result.summaryFields).toBeDefined();
    if (result.summaryFields) {
      expect(result.summaryFields).toHaveLength(2);
      expect(result.summaryFields[0].label).toBe("my first summary field");
      expect(result.summaryFields[1].label).toBe("my second summary field");
    }
  });

  it("handles error from TablesApi", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid request payload" }),
    });

    const requestBody: CreateRelationshipRequest = {
      parentTableId: QB_TABLE_ID_1,
      foreignKeyField: { label: "my relationship field" },
      lookupFieldIds: [1, 2, 3],
      summaryFields: [
        { summaryFid: 3, label: "invalid", accumulationType: "INVALID" },
      ],
    };

    const tableId = QB_TABLE_ID_2;

    await expect(
      client.createRelationship({
        tableId,
        body: requestBody,
      })
    ).rejects.toThrow("API Error: Invalid request payload (Status: 400)");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationship`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": "builderprogram-dbradford6815.quickbase.com",
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
        }),
        body: JSON.stringify(requestBody),
      })
    );
  });

  it("handles response with undefined foreignKeyField and summaryFields", async () => {
    const mockResponse: CreateRelationship200Response = {
      id: 6,
      foreignKeyField: undefined,
      lookupFields: [
        { id: 7, label: "Field 1", type: "text" },
        { id: 8, label: "Field 2", type: "text" },
        { id: 9, label: "Field 3", type: "text" },
      ],
      isCrossApp: false,
      parentTableId: QB_TABLE_ID_1,
      childTableId: QB_TABLE_ID_2,
      summaryFields: undefined,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const requestBody: CreateRelationshipRequest = {
      parentTableId: QB_TABLE_ID_1,
      foreignKeyField: undefined,
      lookupFieldIds: [1, 2, 3],
      summaryFields: undefined,
    };

    const tableId = QB_TABLE_ID_2;

    const result = await client.createRelationship({
      tableId,
      body: requestBody,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationship`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": "builderprogram-dbradford6815.quickbase.com",
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
        }),
        body: JSON.stringify(requestBody),
      })
    );
    expect(result).toEqual(mockResponse);
    expect(result.id).toBe(6);
    expect(result.parentTableId).toBe(QB_TABLE_ID_1);
    expect(result.childTableId).toBe(QB_TABLE_ID_2);
    expect(result.foreignKeyField).toBeUndefined();
    expect(result.lookupFields).toHaveLength(3);
    expect(result.summaryFields).toBeUndefined();
  });
});
