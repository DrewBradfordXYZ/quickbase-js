// tests/vitest/unit/tables/deleteRelationship.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_TABLE_ID_2, // Child table
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - deleteRelationship", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has deleteRelationship method", () => {
    expect(typeof client.deleteRelationship).toBe("function");
  });

  it("sends correct DELETE request and handles successful response", async () => {
    // Mock response for a successful deletion
    const mockResponse = {
      deletedRelationshipId: 6, // Matches the relationshipId
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const tableId = QB_TABLE_ID_2; // Child table
    const relationshipId = 6; // Example relationship ID (foreign key field ID)

    const result = await client.deleteRelationship({
      tableId,
      relationshipId,
    });

    // Verify the fetch call
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationship/6`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": "builderprogram-dbradford6815.quickbase.com",
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
        }),
      })
    );

    // Verify the response
    expect(result).toEqual(mockResponse);
    expect(result.deletedRelationshipId).toBe(6);
  });

  it("handles error when relationship is not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Relationship not found" }),
    });

    const tableId = QB_TABLE_ID_2;
    const relationshipId = 999; // Non-existent relationship ID

    await expect(
      client.deleteRelationship({
        tableId,
        relationshipId,
      })
    ).rejects.toThrow("API Error: Relationship not found (Status: 404)");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${QB_TABLE_ID_2}/relationship/999`,
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "QB-Realm-Hostname": "builderprogram-dbradford6815.quickbase.com",
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
        }),
      })
    );
  });
});
