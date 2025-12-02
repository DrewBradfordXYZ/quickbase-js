// tests/vitest/unit/fields/getFieldsUsage.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_TABLE_ID_1,
  QB_USER_TOKEN,
} from "@tests/setup.ts";
import { FieldUsage } from "@/generated/models";

describe("QuickbaseClient Unit - getFieldsUsage", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("initializes without errors and has getFieldsUsage method", () => {
    expect(client).toBeDefined();
    expect(typeof client.getFieldsUsage).toBe("function");
  });

  it("calls getFieldsUsage successfully with user token", async () => {
    const mockResponse: FieldUsage[] = [
      {
        field: {
          id: 6,
          name: "name",
          type: "Text",
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
          tableImports: { count: 3 },
          tableRules: { count: 1 },
          webhooks: { count: 0 },
        },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.getFieldsUsage({
      tableId: QB_TABLE_ID_1,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/usage?tableId=${QB_TABLE_ID_1}`,
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

  it("calls getFieldsUsage with skip and top parameters", async () => {
    const mockResponse: FieldUsage[] = [
      {
        field: {
          id: 7,
          name: "priority",
          type: "Text",
        },
        usage: {
          actions: { count: 1 },
          appHomePages: { count: 0 },
          dashboards: { count: 0 },
          defaultReports: { count: 0 },
          exactForms: { count: 0 },
          fields: { count: 1 },
          forms: { count: 0 },
          notifications: { count: 0 },
          personalReports: { count: 0 },
          pipelines: { count: 0 },
          relationships: { count: 0 },
          reminders: { count: 0 },
          reports: { count: 1 },
          roles: { count: 1 },
          tableImports: { count: 0 },
          tableRules: { count: 0 },
          webhooks: { count: 0 },
        },
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.getFieldsUsage({
      tableId: QB_TABLE_ID_1,
      skip: 1,
      top: 1,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/usage?tableId=${QB_TABLE_ID_1}&skip=1&top=1`,
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

  it("handles 404 error for non-existent table", async () => {
    const nonExistentTableId = "nonexistent_dbid";

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Table not found" }),
    });

    await expect(
      client.getFieldsUsage({ tableId: nonExistentTableId })
    ).rejects.toThrow("API Error: Table not found (Status: 404)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/usage?tableId=${nonExistentTableId}`,
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
