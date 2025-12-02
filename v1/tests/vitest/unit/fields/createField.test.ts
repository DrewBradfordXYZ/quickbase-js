import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_TABLE_ID_1,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup.ts";
import { CreateFieldRequest } from "@/generated/models";

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

  it("creates field successfully with user token", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: CreateFieldRequest = {
      label: "NewField",
      fieldType: "text",
    };

    const mockResponse = {
      id: 101,
      label: "NewField",
      fieldType: "text",
      appearsByDefault: true,
      audited: false,
      bold: false,
      doesDataCopy: false,
      fieldHelp: "",
      findEnabled: true,
      mode: "",
      noWrap: false,
      permissions: [],
      properties: {
        allowHTML: false,
        allowMentions: false,
        allowNewChoices: false,
        appendOnly: false,
        carryChoices: true,
        defaultValue: "",
        foreignKey: false,
        formula: "",
        maxLength: 0,
        numLines: 1,
        primaryKey: false,
        sortAsGiven: false,
      },
      required: false,
      unique: false,
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
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        },
        credentials: "omit",
      }
    );
  });

  it("creates field successfully with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: CreateFieldRequest = {
      label: "TempField",
      fieldType: "numeric",
      addToForms: false,
    };

    const mockResponse = {
      id: 102,
      label: "TempField",
      fieldType: "numeric",
      appearsByDefault: false,
      audited: false,
      bold: false,
      doesDataCopy: false,
      fieldHelp: "",
      findEnabled: true,
      mode: "",
      noWrap: false,
      permissions: [],
      properties: {
        allowHTML: false,
        allowMentions: false,
        allowNewChoices: false,
        appendOnly: false,
        carryChoices: true,
        defaultValue: "",
        foreignKey: false,
        formula: "",
        maxLength: 0,
        numLines: 1,
        primaryKey: false,
        sortAsGiven: false,
      },
      required: false,
      unique: false,
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
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          Authorization: "QB-TEMP-TOKEN temp_token",
          "Content-Type": "application/json",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
        },
        credentials: "omit",
      }
    );
  });

  it("retries successfully after 401 with temp token", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: CreateFieldRequest = {
      label: "RetryField",
      fieldType: "checkbox",
    };

    const mockResponse = {
      id: 102,
      label: "RetryField",
      fieldType: "checkbox",
      appearsByDefault: true,
      audited: false,
      bold: false,
      doesDataCopy: false,
      fieldHelp: "",
      findEnabled: true,
      mode: "",
      noWrap: false,
      permissions: [],
      properties: {
        allowHTML: false,
        allowMentions: false,
        allowNewChoices: false,
        appendOnly: false,
        carryChoices: true,
        defaultValue: "",
        foreignKey: false,
        formula: "",
        maxLength: 0,
        numLines: 1,
        primaryKey: false,
        sortAsGiven: false,
      },
      required: false,
      unique: false,
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
        text: () => Promise.resolve("Unauthorized"),
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
      {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          Authorization: "QB-TEMP-TOKEN initial_token",
          "Content-Type": "application/json",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
        },
        credentials: "omit",
      }
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          Authorization: "QB-TEMP-TOKEN new_token",
          "Content-Type": "application/json",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
        },
        credentials: "omit",
      }
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for createField (temp token), refreshing token:"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[createField] Retrying with token: new_token..."
    );
    consoleSpy.mockRestore();
  });

  it("handles 400 error for invalid request", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: CreateFieldRequest = {
      label: "", // Invalid: empty label
      fieldType: "text",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Label is required" }),
      text: () => Promise.resolve("Label is required"),
    });

    await expect(
      client.createField({ tableId: QB_TABLE_ID_1, body: request })
    ).rejects.toThrow("API Error: Label is required (Status: 400)");

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
          "Content-Type": "application/json",
        },
        credentials: "omit",
      }
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
        text: () => Promise.resolve("Unauthorized"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token_2" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized again" }),
        text: () => Promise.resolve("Unauthorized again"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token_3" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized again" }),
        text: () => Promise.resolve("Unauthorized again"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "token_4" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized again" }),
        text: () => Promise.resolve("Unauthorized again"),
      });

    const consoleSpy = vi.spyOn(console, "log");

    await expect(
      client.createField({ tableId: QB_TABLE_ID_1, body: request })
    ).rejects.toThrow("API Error: Unauthorized again (Status: 401)");

    expect(mockFetch).toHaveBeenCalledTimes(8);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "POST",
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
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN token_2",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      5,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      6,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN token_3",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      7,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      8,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN token_4",
        }),
      })
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for createField (temp token), refreshing token:"
    );

    consoleSpy.mockRestore();
  });
});
