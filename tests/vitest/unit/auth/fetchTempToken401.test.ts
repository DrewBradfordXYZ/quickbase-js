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
    const mockToken = "initial_token";
    let callCount = 0;

    mockFetch.mockImplementation((url) => {
      callCount++;
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
          json: () => Promise.resolve({ message: "Unauthorized" }),
        });
      }
      if (url.includes("auth/temporary") && callCount === 3) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Temp token fetch failed" }),
        });
      }
      throw new Error(`Unexpected fetch call: ${url}`); // Use throw to stop further retries
    });

    const consoleSpy = vi.spyOn(console, "log");

    await expect(client.getFields({ tableId: QB_TABLE_ID_1 })).rejects.toThrow(
      "API Error: Temp token fetch failed (Status: 401)"
    );

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
          Authorization: `QB-TEMP-TOKEN ${mockToken}`,
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.any(Object)
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields (temp token), refreshing token:"
    );

    consoleSpy.mockRestore();
  });
});
