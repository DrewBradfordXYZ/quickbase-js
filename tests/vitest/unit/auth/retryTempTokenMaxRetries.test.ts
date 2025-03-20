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
      maxRetries: 3,
    });

    const mockDbid = "mockDbid123";
    let callCount = 0;

    mockFetch.mockImplementation((url) => {
      callCount++;
      if (url.includes("auth/temporary") && callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ temporaryAuthorization: "token_1" }),
        });
      }
      if (url.includes("fields") && callCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ message: "Unauthorized 1" }),
        });
      }
      if (url.includes("auth/temporary") && callCount === 3) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ temporaryAuthorization: "token_2" }),
        });
      }
      if (url.includes("fields") && callCount === 4) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ message: "Unauthorized 2" }),
        });
      }
      if (url.includes("auth/temporary") && callCount === 5) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ temporaryAuthorization: "token_3" }),
        });
      }
      if (url.includes("fields") && callCount === 6) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ message: "Unauthorized 3" }),
        });
      }
      if (url.includes("auth/temporary") && callCount === 7) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ temporaryAuthorization: "token_4" }),
        });
      }
      if (url.includes("fields") && callCount === 8) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ message: "Unauthorized 4" }),
        });
      }
      console.log(
        `[mockFetch] Unexpected call: ${url}, callCount: ${callCount}`
      );
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const consoleSpy = vi.spyOn(console, "log");

    await expect(client.getFields({ tableId: mockDbid })).rejects.toThrow(
      "API Error: Unauthorized 4 (Status: 401)"
    );

    expect(mockFetch).toHaveBeenCalledTimes(8);
    // Rest of assertions...
  });

  it("exhausts retries after maxRetries (2) and throws an error", async () => {
    client = createClient(mockFetch, {
      useTempTokens: true,
      debug: true,
      maxRetries: 2,
    });

    const mockDbid = "mockDbid123";
    let callCount = 0;

    mockFetch.mockImplementation((url) => {
      callCount++;
      if (url.includes("auth/temporary") && callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ temporaryAuthorization: "token_1" }),
        });
      }
      if (url.includes("fields") && callCount === 2) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ message: "Unauthorized 1" }),
        });
      }
      if (url.includes("auth/temporary") && callCount === 3) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ temporaryAuthorization: "token_2" }),
        });
      }
      if (url.includes("fields") && callCount === 4) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ message: "Unauthorized 2" }),
        });
      }
      if (url.includes("auth/temporary") && callCount === 5) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ temporaryAuthorization: "token_3" }),
        });
      }
      if (url.includes("fields") && callCount === 6) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: () => Promise.resolve({ message: "Unauthorized 3" }),
        });
      }
      console.log(
        `[mockFetch] Unexpected call: ${url}, callCount: ${callCount}`
      );
      return Promise.reject(new Error(`Unexpected fetch call: ${url}`));
    });

    const consoleSpy = vi.spyOn(console, "log");

    await expect(client.getFields({ tableId: mockDbid })).rejects.toThrow(
      "API Error: Unauthorized 3 (Status: 401)"
    );

    expect(mockFetch).toHaveBeenCalledTimes(6);

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
