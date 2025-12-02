import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import {
  UpdateRelationshipRequest,
  UpdateRelationship200Response,
} from "@/generated/models";

describe("QuickbaseClient Unit - updateRelationship", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors and has updateRelationship method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
    expect(typeof client.updateRelationship).toBe("function");
  });

  it("updates relationship successfully with user token", async () => {
    client = createClient(mockFetch, { debug: true });

    const tableId = QB_TABLE_ID_1;
    const relationshipId = 6;

    const request: UpdateRelationshipRequest = {
      lookupFieldIds: [4, 5, 6],
      summaryFields: [
        {
          summaryFid: 3,
          label: "my summary field",
          accumulationType: "COUNT",
          where: "{'3'.EX.'1'}",
        },
      ],
    };

    const mockResponse: UpdateRelationship200Response = {
      id: relationshipId,
      parentTableId: "bck7gp3q2",
      childTableId: tableId,
      foreignKeyField: {
        id: relationshipId,
        label: "Related record",
        type: "numeric",
      },
      isCrossApp: false,
      lookupFields: [
        { id: 4, label: "Field 4", type: "text" },
        { id: 5, label: "Field 5", type: "numeric" },
        { id: 6, label: "Field 6", type: "date" },
      ],
      summaryFields: [{ id: 8, label: "my summary field", type: "numeric" }],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.updateRelationship({
      tableId,
      relationshipId,
      body: request,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${tableId}/relationship/${relationshipId}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
        credentials: "omit",
      })
    );
  });

  it("updates relationship successfully with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const tableId = QB_TABLE_ID_1;
    const relationshipId = 6;

    const request: UpdateRelationshipRequest = {
      lookupFieldIds: [7],
      summaryFields: [
        {
          summaryFid: 0,
          label: "Count of Records",
          accumulationType: "COUNT",
          where: "{'3'.GT.0}",
        },
      ],
    };

    const mockResponse: UpdateRelationship200Response = {
      id: relationshipId,
      parentTableId: "bck7gp3q2",
      childTableId: tableId,
      foreignKeyField: {
        id: relationshipId,
        label: "Related record",
        type: "numeric",
      },
      isCrossApp: false,
      lookupFields: [{ id: 7, label: "record - text field", type: "text" }],
      summaryFields: [{ id: 9, label: "Count of Records", type: "numeric" }],
    };

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

    const result = await client.updateRelationship({
      tableId,
      relationshipId,
      body: request,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${tableId}`,
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
      `https://api.quickbase.com/v1/tables/${tableId}/relationship/${relationshipId}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
        credentials: "omit",
      })
    );
  });

  it("retries successfully after 401 with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const tableId = QB_TABLE_ID_1;
    const relationshipId = 6;

    const request: UpdateRelationshipRequest = {
      lookupFieldIds: [4],
    };

    const mockResponse: UpdateRelationship200Response = {
      id: relationshipId,
      parentTableId: "bck7gp3q2",
      childTableId: tableId,
      foreignKeyField: {
        id: relationshipId,
        label: "Related record",
        type: "numeric",
      },
      isCrossApp: false,
      lookupFields: [{ id: 4, label: "Field 4", type: "text" }],
      summaryFields: [],
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

    const consoleSpy = vi.spyOn(console, "log");
    const result = await client.updateRelationship({
      tableId,
      relationshipId,
      body: request,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${tableId}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/tables/${tableId}/relationship/${relationshipId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN initial_token",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${tableId}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/tables/${tableId}/relationship/${relationshipId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token",
        }),
      })
    );

    // Updated log expectations
    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for updateRelationship (temp token), refreshing token:"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "[updateRelationship] Retrying with token: new_tok"
      )
    );

    consoleSpy.mockRestore();
  });

  it("handles 400 error for invalid request", async () => {
    client = createClient(mockFetch, { debug: true });

    const tableId = QB_TABLE_ID_1;
    const relationshipId = 6;

    const request: UpdateRelationshipRequest = {
      lookupFieldIds: [-1],
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid field ID" }),
    });

    await expect(
      client.updateRelationship({
        tableId,
        relationshipId,
        body: request,
      })
    ).rejects.toThrow("API Error: Invalid field ID (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables/${tableId}/relationship/${relationshipId}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
        credentials: "omit",
      })
    );
  });
});
