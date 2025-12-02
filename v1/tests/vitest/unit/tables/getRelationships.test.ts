// tests/vitest/unit/relationships/getRelationships.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
  QB_TABLE_ID_2,
} from "@tests/setup.ts";
import { GetRelationships200Response } from "/home/drew/Projects/quickbase-js/src/generated/models";

describe("QuickbaseClient Unit - getRelationships", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true }); // Consistent with output
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has getRelationships method", () => {
    expect(typeof client.getRelationships).toBe("function");
  });

  it("sends correct GET request and handles successful response", async () => {
    const mockResponse: GetRelationships200Response = {
      metadata: {
        numRelationships: 1,
        skip: 0,
        totalRelationships: 1,
      },
      relationships: [
        {
          id: 6,
          parentTableId: QB_TABLE_ID_1, // Parent table
          childTableId: QB_TABLE_ID_2, // Child table
          foreignKeyField: {
            id: 6,
            label: "Related record",
            type: "numeric",
          },
          isCrossApp: false,
          lookupFields: [
            {
              id: 3,
              label: "Name",
              type: "text",
            },
          ],
          summaryFields: [
            {
              id: 8,
              label: "my summary field",
              type: "numeric",
            },
          ],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.getRelationships({
      tableId: QB_TABLE_ID_2,
      skip: 0,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationships?skip=0`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
      })
    );

    expect(result).toEqual(mockResponse);
    expect(result.metadata.numRelationships).toBe(1);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].id).toBe(6);
    expect(result.relationships[0].foreignKeyField.label).toBe(
      "Related record"
    );
  });

  it("handles request without skip parameter", async () => {
    const mockResponse: GetRelationships200Response = {
      metadata: {
        numRelationships: 1,
        skip: 0,
        totalRelationships: 1,
      },
      relationships: [
        {
          id: 6,
          parentTableId: QB_TABLE_ID_1,
          childTableId: QB_TABLE_ID_2,
          foreignKeyField: {
            id: 6,
            label: "Related record",
            type: "numeric",
          },
          isCrossApp: false,
          lookupFields: [],
          summaryFields: [],
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.getRelationships({
      tableId: QB_TABLE_ID_2, // Corrected from QB_TABLE_ID_1
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationships`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
      })
    );

    expect(result).toEqual(mockResponse);
  });

  it("handles API error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Table not found" }),
    });

    await expect(
      client.getRelationships({
        tableId: QB_TABLE_ID_2, // Corrected from QB_TABLE_ID_1
        skip: 0,
      })
    ).rejects.toThrow("API Error: Table not found (Status: 404)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationships?skip=0`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("retries with temp token after 401", async () => {
    const mockResponse: GetRelationships200Response = {
      metadata: {
        numRelationships: 1,
        skip: 0,
        totalRelationships: 1,
      },
      relationships: [
        {
          id: 6,
          parentTableId: QB_TABLE_ID_1,
          childTableId: QB_TABLE_ID_2,
          foreignKeyField: {
            id: 6,
            label: "Related record",
            type: "numeric",
          },
          isCrossApp: false,
        },
      ],
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

    const tempClient = createClient(mockFetch, {
      useTempTokens: true,
      debug: true,
    });
    const result = await tempClient.getRelationships({
      tableId: QB_TABLE_ID_2,
      skip: 0,
    });

    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_2}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationships?skip=0`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN initial_token",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_2}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationships?skip=0`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token",
        }),
      })
    );

    expect(result).toEqual(mockResponse);
  });
});
