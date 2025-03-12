// tests/vitest/unit/fields/getFieldUsage.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { FieldUsage } from "@/generated/models";

describe("QuickbaseClient Unit - getFieldUsage", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { realm: QB_REALM, debug: true });
  });

  it("initializes without errors and has getFieldUsage method", () => {
    expect(client).toBeDefined();
    expect(typeof client.getFieldUsage).toBe("function");
  });

  it("calls getFieldUsage successfully with user token", async () => {
    const mockResponse: FieldUsage = {
      field: {
        id: 6,
        name: "name",
        type: "text", // Match QuickBase's lowercase response
      },
      usage: {
        actions: { count: 0 },
        appHomePages: { count: 0 },
        dashboards: { count: 2 },
        defaultReports: { count: 1 },
        exactForms: { count: 0 },
        fields: { count: 0 },
        forms: { count: 1 },
        notifications: { count: 0 },
        personalReports: { count: 0 },
        pipelines: { count: 1 },
        relationships: { count: 0 },
        reminders: { count: 0 },
        reports: { count: 2 },
        roles: { count: 2 },
        tableImports: { count: 2 },
        tableRules: { count: 1 },
        webhooks: { count: 0 },
      },
    };

    // Mock the response as an array to match the updated API behavior
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([mockResponse]), {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await client.getFieldUsage({
      fieldId: 6,
      tableId: QB_TABLE_ID_1,
    });

    // Expect an array and unwrap the first item
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(1);
    const fieldUsage = result[0];

    expect(fieldUsage).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/usage/6?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
      })
    );
    expect(fieldUsage.field.id).toBe(6);
    expect(fieldUsage.field.name).toBe("name");
    expect(fieldUsage.usage.dashboards.count).toBe(2);
  });

  it("handles 404 error for non-existent field", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Field not found" }), {
        status: 404,
        statusText: "Not Found",
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      client.getFieldUsage({
        fieldId: 999,
        tableId: QB_TABLE_ID_1,
      })
    ).rejects.toThrow("API Error: Field not found (Status: 404)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/usage/999?tableId=${QB_TABLE_ID_1}`,
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

  it("handles 401 error and does not retry with user token", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        statusText: "Unauthorized",
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      client.getFieldUsage({
        fieldId: 6,
        tableId: QB_TABLE_ID_1,
      })
    ).rejects.toThrow("API Error: Unauthorized (Status: 401)");

    expect(mockFetch).toHaveBeenCalledTimes(1); // No retry with user token
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/usage/6?tableId=${QB_TABLE_ID_1}`,
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
});
