// tests/vitest/unit/auth/ticketPromptSessionSource.test.ts
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { TicketPromptSessionSource } from "../../../../src/auth/credential-sources/credentialSources";

describe("TicketPromptSessionSource", () => {
  let credentials: { username: string; password: string };
  let localStorageMock: Record<string, string>;
  let promptCallback: () => Promise<typeof credentials>;

  beforeAll(() => {
    const requiredEnvVars = ["QB_USERNAME", "QB_PASSWORD"];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required env var: ${envVar}`);
      }
    }
    credentials = {
      username: process.env.QB_USERNAME!,
      password: process.env.QB_PASSWORD!,
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
    promptCallback = vi.fn().mockResolvedValue(credentials);
  });

  it("fetches credentials from localStorage if available", async () => {
    localStorageMock["quickbase-credentials"] = JSON.stringify(credentials);
    const source = new TicketPromptSessionSource({
      promptCallback,
      localStorageConfig: { storageKey: "quickbase-credentials" },
    });
    const fetched = await source.getCredentials();
    expect(fetched).toEqual(credentials);
    expect(promptCallback).not.toHaveBeenCalled();
  });

  it("falls back to promptCallback when localStorage is empty", async () => {
    const source = new TicketPromptSessionSource({
      promptCallback,
      localStorageConfig: { storageKey: "quickbase-credentials" },
    });
    const fetched = await source.getCredentials();
    expect(fetched).toEqual(credentials);
    expect(promptCallback).toHaveBeenCalledTimes(1);
    expect(localStorageMock["quickbase-credentials"]).toBe(
      JSON.stringify(credentials)
    );
  });

  it("uses promptCallback when localStorage is not configured", async () => {
    const source = new TicketPromptSessionSource({ promptCallback });
    const fetched = await source.getCredentials();
    expect(fetched).toEqual(credentials);
    expect(promptCallback).toHaveBeenCalledTimes(1);
    expect(Object.keys(localStorageMock).length).toBe(0);
  });

  it("throws when promptCallback returns incomplete credentials", async () => {
    promptCallback = vi.fn().mockResolvedValue({ username: "test-user" });
    const source = new TicketPromptSessionSource({ promptCallback });
    await expect(source.getCredentials()).rejects.toThrow(
      "Client prompt returned incomplete credentials"
    );
  });

  it("refreshes credentials by clearing localStorage and re-prompting", async () => {
    localStorageMock["quickbase-credentials"] = JSON.stringify({
      username: "old-user",
    });
    const source = new TicketPromptSessionSource({
      promptCallback,
      localStorageConfig: { storageKey: "quickbase-credentials" },
    });
    const refreshed = await source.refreshCredentials();
    expect(refreshed).toEqual(credentials);
    expect(promptCallback).toHaveBeenCalledTimes(1);
    expect(localStorageMock["quickbase-credentials"]).toBe(
      JSON.stringify(credentials)
    );
  });

  it("clears localStorage credentials when configured", async () => {
    localStorageMock["quickbase-credentials"] = JSON.stringify(credentials);
    const source = new TicketPromptSessionSource({
      promptCallback,
      localStorageConfig: { storageKey: "quickbase-credentials" },
    });
    source.clearCredentials();
    expect(localStorageMock["quickbase-credentials"]).toBeUndefined();
  });

  it("logs debug messages when debug is enabled", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const source = new TicketPromptSessionSource({
      promptCallback,
      localStorageConfig: { storageKey: "quickbase-credentials" },
      debug: true,
    });

    localStorageMock["quickbase-credentials"] = JSON.stringify(credentials);
    await source.getCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketPromptSessionSource] Fetched credentials from localStorage"
    );

    delete localStorageMock["quickbase-credentials"];
    await source.getCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketPromptSessionSource] Fetched credentials from client prompt"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketPromptSessionSource] Stored prompted credentials in localStorage"
    );

    await source.refreshCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketPromptSessionSource] Refreshing credentials"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketPromptSessionSource] Cleared localStorage for refresh"
    );

    const error = new Error("Prompt failed");
    promptCallback = vi.fn().mockRejectedValue(error);
    const sourceWithoutLocalStorage = new TicketPromptSessionSource({
      promptCallback,
      debug: true,
    });
    await expect(sourceWithoutLocalStorage.getCredentials()).rejects.toThrow(
      "Client prompt error: Prompt failed"
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[TicketPromptSessionSource] Failed to fetch credentials:",
      error
    );

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("throws when promptCallback fails", async () => {
    promptCallback = vi.fn().mockRejectedValue(new Error("Prompt failed"));
    const source = new TicketPromptSessionSource({ promptCallback });
    await expect(source.getCredentials()).rejects.toThrow(
      "Client prompt error: Prompt failed"
    );
  });
});
