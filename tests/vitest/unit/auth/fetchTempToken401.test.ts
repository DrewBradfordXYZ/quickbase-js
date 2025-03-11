// tests/vitest/unit/auth/fetchTempToken401.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - 401 with fetchTempToken 401", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { useTempTokens: true, debug: true });
  });

  it("fails without infinite loop when fetchTempToken returns 401 after initial 401", async () => {
    let callCount = 0;

    mockFetch.mockImplementation((url) => {
      callCount++;
      console.log(`Mock fetch call ${callCount}: ${url}`);
      if (url.includes("auth/temporary") && callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ temporaryAuthorization: "initial_token" }),
        });
      }
      if (url.includes("fields") && callCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized" }),
        });
      }
      if (url.includes("auth/temporary") && callCount === 3) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({ message: "Unauthorized in fetchTempToken" }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const consoleSpy = vi.spyOn(console, "log");
    await expect(client.getFields({ tableId: QB_TABLE_ID_1 })).rejects.toThrow(
      "API Error: Unauthorized in fetchTempToken (Status: 401)"
    );

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`, // Removed &includeFieldPerms=false
      expect.objectContaining({
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields, refreshing token:",
      expect.any(String)
    );
    expect(consoleSpy).not.toHaveBeenCalledWith(
      "Retrying getFields with new token"
    );
    consoleSpy.mockRestore();
  });
});
