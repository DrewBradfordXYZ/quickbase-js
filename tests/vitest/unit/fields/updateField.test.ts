import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_APP_ID,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { UpdateFieldRequest, UpdateField200Response } from "@/generated/models";

describe("QuickbaseClient Unit - updateField", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes and has updateField method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
    expect(typeof client.updateField).toBe("function");
  });

  it("updates field successfully with user token", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
    });

    const tableId = QB_TABLE_ID_1;
    const fieldId = 123;

    const request: UpdateFieldRequest = {
      label: "Field1",
      fieldType: "text", // Required
      noWrap: false,
      bold: false,
      required: true,
      appearsByDefault: false,
      findEnabled: false,
      unique: true,
      fieldHelp: "field help",
      addToForms: true,
      permissions: [
        { role: "Viewer", permissionType: "View", roleId: 10 },
        { role: "Participant", permissionType: "None", roleId: 11 },
        { role: "Administrator", permissionType: "Modify", roleId: 12 },
      ],
    };

    const mockResponse: UpdateField200Response = {
      id: fieldId,
      label: "Field1",
      fieldType: "text",
      mode: "",
      noWrap: false,
      bold: false,
      required: true,
      appearsByDefault: false,
      findEnabled: false,
      unique: true,
      doesDataCopy: false,
      fieldHelp: "field help",
      audited: false,
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

    const result = await client.updateField({
      fieldId,
      tableId,
      body: request,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/${fieldId}?tableId=${tableId}`,
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

  it("updates field successfully with temp token", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      debug: true,
    });

    const tableId = QB_TABLE_ID_1;
    const fieldId = 123;

    const request: UpdateFieldRequest = {
      label: "Field1",
      fieldType: "text", // Required
      required: true,
      unique: true,
    };

    const mockResponse: UpdateField200Response = {
      id: fieldId,
      label: "Field1",
      fieldType: "text",
      mode: "",
      noWrap: false,
      bold: false,
      required: true,
      appearsByDefault: false,
      findEnabled: false,
      unique: true,
      doesDataCopy: false,
      fieldHelp: "",
      audited: false,
      permissions: [
        { permissionType: "View", role: "Viewer", roleId: 10 },
        { permissionType: "None", role: "Participant", roleId: 11 },
        { permissionType: "Modify", role: "Administrator", roleId: 12 },
      ],
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

    const result = await client.updateField({
      fieldId,
      tableId,
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
      `https://api.quickbase.com/v1/fields/${fieldId}?tableId=${tableId}`,
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

  it("handles 400 error for invalid field update", async () => {
    client = createClient(mockFetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
    });

    const tableId = QB_TABLE_ID_1;
    const fieldId = 999;

    const request: UpdateFieldRequest = {
      label: "InvalidField",
      fieldType: "text", // Required
      required: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid field ID" }),
    });

    await expect(
      client.updateField({ fieldId, tableId, body: request })
    ).rejects.toThrow("API Error: Invalid field ID (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields/${fieldId}?tableId=${tableId}`,
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
