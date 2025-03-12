// tests/vitest/unit/fields/getField.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { Field } from "@/generated/models";

describe("QuickbaseClient Unit - getField", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { debug: true });
  });

  it("initializes without errors and has getField method", () => {
    expect(client).toBeDefined();
    expect(typeof client.getField).toBe("function");
  });

  it("calls getField successfully with user token", async () => {
    const mockResponse: Field = {
      id: 123,
      label: "Field1",
      fieldType: "text",
      mode: "",
      noWrap: false,
      bold: false,
      required: false,
      appearsByDefault: false,
      findEnabled: false,
      unique: false,
      doesDataCopy: false,
      fieldHelp: "field help",
      audited: false,
      properties: {
        primaryKey: false,
        foreignKey: false,
        numLines: 1,
        maxLength: 0,
        appendOnly: false,
        allowHTML: false,
        allowMentions: false,
        sortAsGiven: false,
        carryChoices: true,
        allowNewChoices: false,
        formula: "",
        defaultValue: "",
      },
      permissions: [
        { permissionType: "View", role: "Viewer", roleId: 10 },
        { permissionType: "None", role: "Participant", roleId: 11 },
        { permissionType: "Modify", role: "Administrator", roleId: 12 },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.getField({
      fieldId: 123,
      tableId: QB_TABLE_ID_1,
      includeFieldPerms: true,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/123?tableId=${QB_TABLE_ID_1}&includeFieldPerms=true`,
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

  it("calls getField successfully with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const mockResponse: Field = {
      id: 123,
      label: "Field1",
      fieldType: "text",
      mode: "",
      noWrap: false,
      bold: false,
      required: false,
      appearsByDefault: false,
      findEnabled: false,
      unique: false,
      doesDataCopy: false,
      fieldHelp: "field help",
      audited: false,
      properties: {
        primaryKey: false,
        foreignKey: false,
        numLines: 1,
        maxLength: 0,
        appendOnly: false,
        allowHTML: false,
        allowMentions: false,
        sortAsGiven: false,
        carryChoices: true,
        allowNewChoices: false,
        formula: "",
        defaultValue: "",
      },
      permissions: [],
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

    const result = await client.getField({
      fieldId: 123,
      tableId: QB_TABLE_ID_1,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
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
      `https://api.quickbase.com/v1/fields/123?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("handles 404 error for non-existent field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Field not found" }),
    });

    await expect(
      client.getField({ fieldId: 999, tableId: QB_TABLE_ID_1 })
    ).rejects.toThrow("API Error: Field not found (Status: 404)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/999?tableId=${QB_TABLE_ID_1}`,
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
