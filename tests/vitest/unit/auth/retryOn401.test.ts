// tests/vitest/unit/auth/retryOn401.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - 401 Retry Creates New Token", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { useTempTokens: true, debug: true });
  });

  it("creates a new token on 401 and retries successfully", async () => {
    const mockToken = "new_token_456";
    const mockFields = [{ id: 1, label: "Field1" }];
    let callCount = 0;

    mockFetch.mockImplementation((url) => {
      callCount++;
      console.log(`Mock fetch call ${callCount}: ${url}`);
      if (url.includes("auth/temporary") && callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ temporaryAuthorization: mockToken }),
        });
      }
      if (url.includes("fields") && callCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve("Unauthorized"),
        });
      }
      if (url.includes("auth/temporary") && callCount === 3) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ temporaryAuthorization: mockToken + "_retry" }),
        });
      }
      if (url.includes("fields") && callCount === 4) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockFields),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const consoleSpy = vi.spyOn(console, "log");
    const result = await client.getFields({ tableId: QB_TABLE_ID_1 });

    expect(result).toEqual(mockFields);
    expect(mockFetch).toHaveBeenCalledTimes(4);
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
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`, // Removed &includeFieldPerms=false
      expect.objectContaining({
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
        }),
      })
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields, refreshing token:",
      expect.any(String)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      `Fetched and cached new token for dbid: ${QB_TABLE_ID_1}`,
      mockToken + "_retry",
      expect.any(String)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Retrying getFields with new token"
    );
    consoleSpy.mockRestore();
  });
});
