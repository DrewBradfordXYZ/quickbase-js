// tests/vitest/unit/auth/ticketInMemorySessionSource.test.ts
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { TicketInMemorySessionSource } from "../../../../src/auth/credential-sources/credentialSources";

describe("TicketInMemorySessionSource", () => {
  let credentials: { username: string; password: string };

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
  });

  it("fetches credentials when initialized with initialCredentials", async () => {
    const source = new TicketInMemorySessionSource(credentials, true);
    const fetched = await source.getCredentials();
    expect(fetched).toEqual(credentials);
  });

  it("throws when fetching credentials without initialization", async () => {
    const source = new TicketInMemorySessionSource();
    await expect(source.getCredentials()).rejects.toThrow(
      "No credentials set in session"
    );
  });

  it("refreshes credentials by returning the same in-memory credentials", async () => {
    const source = new TicketInMemorySessionSource(credentials);
    const refreshed = await source.refreshCredentials();
    expect(refreshed).toEqual(credentials);
  });

  it("throws when refreshing credentials without initialization", async () => {
    const source = new TicketInMemorySessionSource();
    await expect(source.refreshCredentials()).rejects.toThrow(
      "No credentials set in session"
    );
  });

  it("sets new credentials and retrieves them", async () => {
    const source = new TicketInMemorySessionSource();
    const newCredentials = {
      username: "new-user@example.com",
      password: "new-password",
    };
    source.setCredentials(newCredentials);
    const fetched = await source.getCredentials();
    expect(fetched).toEqual(newCredentials);
  });

  it("clears credentials and throws on subsequent fetch", async () => {
    const source = new TicketInMemorySessionSource(credentials);
    source.clearCredentials();
    await expect(source.getCredentials()).rejects.toThrow(
      "No credentials set in session"
    );
  });

  it("logs debug messages when debug is enabled", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const source = new TicketInMemorySessionSource(credentials, true);

    await source.getCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketInMemorySessionSource] Fetched credentials from session"
    );

    await source.refreshCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketInMemorySessionSource] Refreshing credentials from session"
    );

    source.setCredentials(credentials);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketInMemorySessionSource] Set credentials in session"
    );

    source.clearCredentials();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[TicketInMemorySessionSource] Cleared credentials from session"
    );

    consoleSpy.mockRestore();
  });
});
