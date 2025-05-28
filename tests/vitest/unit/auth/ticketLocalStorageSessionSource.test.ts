// tests/vitest/unit/auth/ticketLocalStorageSessionSource.test.ts
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { TicketLocalStorageSessionSource } from "../../../../src/auth/credential-sources/credentialSources";

describe("TicketLocalStorageSessionSource", () => {
  let credentials: { username: string; password: string; appToken: string };
  let localStorageMock: Record<string, string>;

  beforeAll(() => {
    const requiredEnvVars = ["QB_USERNAME", "QB_PASSWORD", "QB_APP_TOKEN"];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required env var: ${envVar}`);
      }
    }
    credentials = {
      username: process.env.QB_USERNAME!,
      password: process.env.QB_PASSWORD!,
      appToken: process.env.QB_APP_TOKEN!,
    };
  });

  beforeEach(() => {
    vi.resetAllMocks();
    localStorageMock = {};
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => localStorageMock[key] || null,
        setItem: (key: string, value: string) =>
          (localStorageMock[key] = value),
        removeItem: (key: string) => delete localStorageMock[key],
        clear: () => (localStorageMock = {}),
      },
    });
  });

  it("fetches credentials from localStorage", async () => {
    localStorageMock["quickbase-credentials"] = JSON.stringify(credentials);
    const source = new TicketLocalStorageSessionSource({
      storageKey: "quickbase-credentials",
    });
    const fetched = await source.getCredentials();
    expect(fetched).toEqual(credentials);
  });

  it("throws when localStorage is missing credentials", async () => {
    const source = new TicketLocalStorageSessionSource();
    await expect(source.getCredentials()).rejects.toThrow(
      "No credentials found in localStorage"
    );
  });

  it("throws when localStorage has invalid JSON", async () => {
    localStorageMock["quickbase-credentials"] = "invalid-json";
    const source = new TicketLocalStorageSessionSource({
      storageKey: "quickbase-credentials",
    });
    await expect(source.getCredentials()).rejects.toThrow(/localStorage error/);
  });

  it("throws when localStorage has incomplete credentials", async () => {
    localStorageMock["quickbase-credentials"] = JSON.stringify({
      username: "test-user",
    });
    const source = new TicketLocalStorageSessionSource({
      storageKey: "quickbase-credentials",
    });
    await expect(source.getCredentials()).rejects.toThrow(
      "Incomplete credentials in localStorage"
    );
  });

  it("refreshes credentials by fetching from localStorage", async () => {
    localStorageMock["quickbase-credentials"] = JSON.stringify(credentials);
    const source = new TicketLocalStorageSessionSource({
      storageKey: "quickbase-credentials",
    });
    const refreshed = await source.refreshCredentials();
    expect(refreshed).toEqual(credentials);
  });

  it("sets credentials in localStorage", async () => {
    const source = new TicketLocalStorageSessionSource({
      storageKey: "quickbase-credentials",
    });
    source.setCredentials(credentials);
    expect(localStorageMock["quickbase-credentials"]).toBe(
      JSON.stringify(credentials)
    );
  });

  it("clears credentials from localStorage", async () => {
    localStorageMock["quickbase-credentials"] = JSON.stringify(credentials);
    const source = new TicketLocalStorageSessionSource({
      storageKey: "quickbase-credentials",
    });
    source.clearCredentials();
    expect(localStorageMock["quickbase-credentials"]).toBeUndefined();
  });

  it("logs debug messages when debug is enabled", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    localStorageMock["quickbase-credentials"] = JSON.stringify(credentials);
    const source = new TicketLocalStorageSessionSource({
      storageKey: "quickbase-credentials",
      debug: true,
    });

    await source.getCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketLocalStorageSessionSource] Fetched credentials from localStorage"
    );

    await source.refreshCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketLocalStorageSessionSource] Refreshing credentials from localStorage"
    );

    source.setCredentials(credentials);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketLocalStorageSessionSource] Stored credentials in localStorage"
    );

    source.clearCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketLocalStorageSessionSource] Cleared credentials from localStorage"
    );

    localStorageMock["quickbase-credentials"] = "invalid-json";
    await expect(source.getCredentials()).rejects.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[TicketLocalStorageSessionSource] Failed to fetch credentials:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("throws when localStorage is unavailable", async () => {
    vi.stubGlobal("window", {});
    const source = new TicketLocalStorageSessionSource();
    await expect(source.getCredentials()).rejects.toThrow(
      "localStorage is not available"
    );
    expect(() => source.setCredentials(credentials)).toThrow(
      "localStorage is not available"
    );
  });
});
