import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { CreateFieldRequest, CreateField200Response } from "@/generated/models";

describe("QuickbaseClient Unit - createField", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors and has createField method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
    expect(typeof client.createField).toBe("function");
  });

  it("creates a field successfully with user token", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: CreateFieldRequest = {
      label: "TestField",
      fieldType: "text",
      fieldHelp: "A test field",
      addToForms: true,
      permissions: [
        { role: "Viewer", permissionType: "View", roleId: 10 },
        { role: "Administrator", permissionType: "Modify", roleId: 12 },
      ],
    };

    const mockResponse: CreateField200Response = {
      id: 100,
      label: "TestField",
      fieldType: "text",
      mode: "",
      noWrap: false,
      bold: false,
      required: false,
      appearsByDefault: true,
      findEnabled: true,
      unique: false,
      doesDataCopy: false,
      fieldHelp: "A test field",
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
        { permissionType: "Modify", role: "Administrator", roleId: 12 },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.createField({
      tableId: QB_TABLE_ID_1,
      body: request,
    });

    expect(result).toEqual(mockResponse);
    const callArgs = mockFetch.mock.calls[0];
    console.log("Raw fetch call (user token):", callArgs);
    const receivedBody = JSON.parse(callArgs[1].body as string);
    expect(receivedBody).toEqual(request);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
      })
    );
  });

  it("creates a field successfully with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: CreateFieldRequest = {
      label: "TempField",
      fieldType: "numeric",
      addToForms: false,
    };

    const mockResponse: CreateField200Response = {
      id: 101,
      label: "TempField",
      fieldType: "numeric",
      mode: "",
      noWrap: false,
      bold: false,
      required: false,
      appearsByDefault: true,
      findEnabled: true,
      unique: false,
      doesDataCopy: false,
      fieldHelp: "",
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

    const result = await client.createField({
      tableId: QB_TABLE_ID_1,
      body: request,
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
    const callArgs = mockFetch.mock.calls[1];
    console.log("Raw fetch call (temp token):", callArgs);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
      })
    );
  });

  it("retries successfully after 401 with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: CreateFieldRequest = {
      label: "RetryField",
      fieldType: "checkbox",
    };

    const mockResponse: CreateField200Response = {
      id: 102,
      label: "RetryField",
      fieldType: "checkbox",
      mode: "",
      noWrap: false,
      bold: false,
      required: false,
      appearsByDefault: true,
      findEnabled: true,
      unique: false,
      doesDataCopy: false,
      fieldHelp: "",
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
    const result = await client.createField({
      tableId: QB_TABLE_ID_1,
      body: request,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN initial_token",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token",
        }),
      })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for createField (temp token), refreshing token:",
      expect.any(String)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Retrying createField with temp token"
    );
    consoleSpy.mockRestore();
  });

  it("handles 400 error for invalid request", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: CreateFieldRequest = {
      label: "", // Invalid: label is required
      fieldType: "text",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Label is required" }),
    });

    await expect(
      client.createField({ tableId: QB_TABLE_ID_1, body: request })
    ).rejects.toThrow("API Error: Label is required (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
      })
    );
  });

  it("handles 401 with failed temp token retry", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: CreateFieldRequest = {
      label: "FailField",
      fieldType: "text",
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
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Temp token fetch failed" }),
      });

    const consoleSpy = vi.spyOn(console, "log");
    await expect(
      client.createField({ tableId: QB_TABLE_ID_1, body: request })
    ).rejects.toThrow("API Error: Temp token fetch failed (Status: 401)");

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN initial_token",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for createField (temp token), refreshing token:",
      expect.any(String)
    );
    consoleSpy.mockRestore();
  });
});
