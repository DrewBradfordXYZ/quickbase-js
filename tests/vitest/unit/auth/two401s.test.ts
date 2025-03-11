import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch } from "@tests/setup.ts";

describe("QuickbaseClient - Two 401s in a Row", () => {
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
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized again" }), // Changed to json()
          text: () => Promise.resolve("Unauthorized again"), // Keep text() for fallback
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const consoleSpy = vi.spyOn(console, "log");
    await expect(client.getFields({ tableId: mockDbid })).rejects.toThrow(
      "API Error: Unauthorized again (Status: 401)"
    );

    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields, refreshing token:",
      expect.any(String)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Fetched and cached new token for dbid: mockDbid123",
      mockToken + "_retry",
      expect.any(String)
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Retrying getFields with new token"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error response body for getFields:",
      { message: "Unauthorized again" }
    );
    consoleSpy.mockRestore();
  });
});
