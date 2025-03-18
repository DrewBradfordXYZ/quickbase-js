// tests/vitest/unit/formulas/runFormula.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { RunFormulaRequest, RunFormula200Response } from "@/generated/models";

describe("QuickbaseClient Unit - runFormula", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors and has runFormula method", () => {
    client = createClient(mockFetch, { debug: true });
    expect(client).toBeDefined();
    expect(typeof client.runFormula).toBe("function");
  });

  it("calls runFormula successfully with user token", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: RunFormulaRequest = {
      from: QB_TABLE_ID_1,
      formula: "Sum([NumericField],20)",
      rid: 1,
    };

    const mockResponse: RunFormula200Response = {
      result: "30",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.runFormula({ body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/formula/run",
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
    expect(result.result).toBe("30");
  });

  it("handles missing rid for formulas not requiring it", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: RunFormulaRequest = {
      from: QB_TABLE_ID_1,
      formula: "User()",
      // rid omitted intentionally
    };

    const mockResponse: RunFormula200Response = {
      result: "user@example.com",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await client.runFormula({ body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/formula/run",
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
    expect(result.result).toBe("user@example.com");
  });

  it("handles API error for invalid formula", async () => {
    client = createClient(mockFetch, { debug: true });

    const request: RunFormulaRequest = {
      from: QB_TABLE_ID_1,
      formula: "InvalidFormula()",
      rid: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid formula syntax" }),
    });

    await expect(client.runFormula({ body: request })).rejects.toThrow(
      "API Error: Invalid formula syntax (Status: 400)"
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/formula/run",
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

  it("handles temp token with retry on 401", async () => {
    client = createClient(mockFetch, { useTempTokens: true, debug: true });

    const request: RunFormulaRequest = {
      from: QB_TABLE_ID_1,
      formula: "Sum([NumericField],20)",
      rid: 1,
    };

    const mockResponse: RunFormula200Response = {
      result: "30",
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ temporaryAuthorization: "temp_token" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ temporaryAuthorization: "new_temp_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

    const result = await client.runFormula({ body: request });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      "https://api.quickbase.com/v1/formula/run",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_temp_token",
        }),
      })
    );
  });
});
