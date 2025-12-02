// tests/vitest/unit/fields/deleteFields.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import {
  DeleteFieldsRequest,
  DeleteFields200Response,
} from "@/generated/models";

describe("QuickbaseClient Unit - deleteFields", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors and has deleteFields method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
    expect(typeof client.deleteFields).toBe("function");
  });

  it("deletes fields successfully with user token", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: DeleteFieldsRequest = {
      fieldIds: [6, 7, 8],
    };

    const mockResponse: DeleteFields200Response = {
      deletedFieldIds: [6, 7, 8],
      errors: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.deleteFields({
      tableId: QB_TABLE_ID_1,
      body: request,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "DELETE",
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

  it("handles partial success with errors", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: DeleteFieldsRequest = {
      fieldIds: [6, 7, 8],
    };

    const mockResponse: DeleteFields200Response = {
      deletedFieldIds: [6, 8],
      errors: ["Error found with fid: 7"],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.deleteFields({
      tableId: QB_TABLE_ID_1,
      body: request,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "DELETE",
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

  it("handles 400 error for invalid request", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: DeleteFieldsRequest = {
      fieldIds: [], // Invalid: empty fieldIds array
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          message: "Invalid input",
          description: "Field IDs list cannot be empty.",
        }),
    });

    await expect(
      client.deleteFields({ tableId: QB_TABLE_ID_1, body: request })
    ).rejects.toThrow("API Error: Invalid input (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "DELETE",
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
