import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch } from "@tests/setup.ts";

describe("QuickbaseClient - Temp Token Retry Limit", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("exhausts retries after maxRetries (3) and throws an error", async () => {
    client = createClient(mockFetch, {
      useTempTokens: true,
      debug: true,
      maxRetries: 3, // Explicitly set maxRetries to 3
    });

    const mockDbid = "mockDbid123";
    let callCount = 0;

    mockFetch.mockImplementation((url) => {
      callCount++;
      // Initial temp token fetch
      if (url.includes("auth/temporary") && callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ temporaryAuthorization: "token_1" }),
        });
      }
      // First attempt: 401
      if (url.includes("fields") && callCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized 1" }),
        });
      }
      // Second temp token fetch
      if (url.includes("auth/temporary") && callCount === 3) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ temporaryAuthorization: "token_2" }),
        });
      }
      // Second attempt: 401
      if (url.includes("fields") && callCount === 4) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized 2" }),
        });
      }
      // Third temp token fetch
      if (url.includes("auth/temporary") && callCount === 5) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ temporaryAuthorization: "token_3" }),
        });
      }
      // Third attempt: 401
      if (url.includes("fields") && callCount === 6) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized 3" }),
        });
      }
      // Fourth temp token fetch
      if (url.includes("auth/temporary") && callCount === 7) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ temporaryAuthorization: "token_4" }),
        });
      }
      // Fourth attempt: 401
      if (url.includes("fields") && callCount === 8) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized 4" }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const consoleSpy = vi.spyOn(console, "log");

    await expect(client.getFields({ tableId: mockDbid })).rejects.toThrow(
      "API Error: Unauthorized 4 (Status: 401)"
    );

    expect(mockFetch).toHaveBeenCalledTimes(8); // 4 token fetches + 4 API attempts

    const tokenLogs = consoleSpy.mock.calls.filter((call) =>
      call[0].includes("Fetched and cached new token")
    );
    expect(tokenLogs).toHaveLength(4);
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      "token_1",
    ]);
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      "token_2",
    ]);
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      "token_3",
    ]);
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      "token_4",
    ]);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields (temp token), refreshing token:"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[getFields] Retrying with token: token_2..."
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[getFields] Retrying with token: token_3..."
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[getFields] Retrying with token: token_4..."
    );

    consoleSpy.mockRestore();
  });

  it("exhausts retries after maxRetries (2) and throws an error", async () => {
    client = createClient(mockFetch, {
      useTempTokens: true,
      debug: true,
      maxRetries: 2, // Explicitly set maxRetries to 2
    });

    const mockDbid = "mockDbid123";
    let callCount = 0;

    mockFetch.mockImplementation((url) => {
      callCount++;
      // Initial temp token fetch
      if (url.includes("auth/temporary") && callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ temporaryAuthorization: "token_1" }),
        });
      }
      // First attempt: 401
      if (url.includes("fields") && callCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized 1" }),
        });
      }
      // Second temp token fetch
      if (url.includes("auth/temporary") && callCount === 3) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ temporaryAuthorization: "token_2" }),
        });
      }
      // Second attempt: 401
      if (url.includes("fields") && callCount === 4) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized 2" }),
        });
      }
      // Third temp token fetch
      if (url.includes("auth/temporary") && callCount === 5) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ temporaryAuthorization: "token_3" }),
        });
      }
      // Third attempt: 401
      if (url.includes("fields") && callCount === 6) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: "Unauthorized 3" }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const consoleSpy = vi.spyOn(console, "log");

    await expect(client.getFields({ tableId: mockDbid })).rejects.toThrow(
      "API Error: Unauthorized 3 (Status: 401)"
    );

    expect(mockFetch).toHaveBeenCalledTimes(6); // 3 token fetches + 3 API attempts

    const tokenLogs = consoleSpy.mock.calls.filter((call) =>
      call[0].includes("Fetched and cached new token")
    );
    expect(tokenLogs).toHaveLength(3);
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      "token_1",
    ]);
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      "token_2",
    ]);
    expect(tokenLogs).toContainEqual([
      "Fetched and cached new token for dbid: mockDbid123",
      "token_3",
    ]);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields (temp token), refreshing token:"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[getFields] Retrying with token: token_2..."
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[getFields] Retrying with token: token_3..."
    );

    consoleSpy.mockRestore();
  });
});
