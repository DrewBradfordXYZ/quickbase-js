import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch } from "@tests/setup.ts";

describe("QuickbaseClient - Two Temp Token 401s in a Row", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, { useTempTokens: true, debug: true });
  });

  it("logs an error after two 401s in a row", async () => {
    const mockDbid = "mockDbid123";
    const mockToken = "new_token_456";
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
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ temporaryAuthorization: mockToken + "_retry" }),
        });
      }
      if (url.includes("fields") && callCount === 4) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized again" }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const consoleSpy = vi.spyOn(console, "log");

    await expect(client.getFields({ tableId: mockDbid })).rejects.toThrow(
      "API Error: Unauthorized again (Status: 401)"
    );

    expect(mockFetch).toHaveBeenCalledTimes(4);

    const tokenLogs = consoleSpy.mock.calls.filter((call) =>
      call[0].includes("Fetched and cached new token")
    );
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      mockToken,
    ]);
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      mockToken + "_retry",
    ]);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields (temp token), refreshing token:",
      expect.any(String)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Retrying getFields with temp token"
    );

    consoleSpy.mockRestore();
  });
});
