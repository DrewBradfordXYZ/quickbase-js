// tests/vitest/qb/auth/ticketTokenStrategy.test.ts
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { createClient, mockFetch, QB_REALM, QB_TABLE_ID_1 } from "@tests/setup";
import {
  InMemoryCache,
  LocalStorageTicketCache,
  TicketCacheEntry,
  TicketData,
} from "../../../../src/cache/TicketCache";
import { TokenCache } from "../../../../src/cache/TokenCache";
import { TicketInMemorySessionSource } from "../../../../src/auth/credential-sources/credentialSources";

describe("TicketTokenStrategy", () => {
  beforeAll(() => {
    const requiredEnvVars = [
      "QB_REALM",
      "QB_USERNAME",
      "QB_PASSWORD",
      "QB_TABLE_ID_1",
    ];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required env var: ${envVar}`);
      }
    }
  });

  beforeEach(() => {
    mockFetch.mockReset();
    // Mock API_Authenticate response
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[QuickBase]: API_Authenticate:", { url, options });
      if (
        url === `https://${QB_REALM}.quickbase.com/db/main` &&
        options.method === "POST" &&
        options.headers["QUICKBASE-ACTION"] === "API_Authenticate"
      ) {
        expect(options.headers["QB-App-Token"]).toBeUndefined();
        return new Response(
          `
            <qdbapi>
              <action>API_Authenticate</action>
              <errcode>0</errcode>
              <errtext>No error</errtext>
              <ticket>mock-ticket-123</ticket>
            </qdbapi>
          `,
          {
            status: 200,
            headers: {
              "Content-Type": "application/xml",
              "Set-Cookie": "TICKET=mock-ticket-123; Path=/;",
            },
          }
        );
      }
      throw new Error(`Unexpected API_Authenticate request: ${url}`);
    });
  });

  it(
    "uses LocalStorageTicketCache by default in browser",
    { timeout: 5000 },
    async () => {
      const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
          getItem: (key: string) => store[key] || null,
          setItem: (key: string, value: string) => (store[key] = value),
          removeItem: (key: string) => delete store[key],
          clear: () => (store = {}),
        };
      })();
      vi.stubGlobal("window", { localStorage: localStorageMock });

      mockFetch.mockImplementationOnce(async (url, options) => {
        console.log("[QuickBase]: getTempTokenDBID:", { url, options });
        if (
          url ===
            `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}` &&
          options.headers["Authorization"] === "QB-TICKET mock-ticket-123"
        ) {
          return new Response(
            JSON.stringify({ temporaryAuthorization: "mock-temp-token-456" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        throw new Error(`Unexpected getTempTokenDBID request: ${url}`);
      });

      mockFetch.mockImplementationOnce(async (url, options) => {
        console.log("[QuickBase]: runQuery:", { url, options });
        if (
          url === `https://api.quickbase.com/v1/records/query` &&
          options.method === "POST" &&
          options.headers["Authorization"] ===
            "QB-TEMP-TOKEN mock-temp-token-456"
        ) {
          return new Response(
            JSON.stringify({
              data: [{ 3: { value: "test" } }],
              metadata: { totalRecords: 1, numRecords: 1, skip: 0 },
              fields: [{ id: 3, label: "Field3", type: "text" }],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        throw new Error(`Unexpected runQuery request: ${url}`);
      });

      const client = createClient(mockFetch, {
        useTicketAuth: true,
        ticketInMemorySessionSource: {
          initialCredentials: {
            username: process.env.QB_USERNAME!,
            password: process.env.QB_PASSWORD!,
          },
        },
      });
      const response = await client.runQuery({
        body: {
          from: QB_TABLE_ID_1,
          select: [3],
          options: { top: 1 },
        },
      });
      expect(response.data).toBeDefined();
      expect(localStorageMock.getItem("quickbase-ticket:ticket")).toBeDefined();
      const cachedEntry = localStorageMock.getItem("quickbase-ticket:ticket");
      const parsedEntry = JSON.parse(cachedEntry!);
      expect(parsedEntry).toHaveProperty("value.ticket", "mock-ticket-123");
      expect(parsedEntry).toHaveProperty("expiresAt");

      vi.unstubAllGlobals();
    }
  );

  it("supports custom ticket cache", { timeout: 5000 }, async () => {
    class MockTicketCache<T> implements TicketCache<T> {
      private store: Map<string, TicketCacheEntry<T>> = new Map();
      get(key: string) {
        const entry = this.store.get(key);
        if (entry && entry.expiresAt > Date.now()) {
          return entry;
        }
        this.store.delete(key);
        return undefined;
      }
      set(key: string, value: T, lifespan: number) {
        this.store.set(key, { value, expiresAt: Date.now() + lifespan });
      }
      delete(key: string) {
        this.store.delete(key);
      }
      clear() {
        this.store.clear();
      }
    }

    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[QuickBase]: getTempTokenDBID:", { url, options });
      if (
        url ===
          `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}` &&
        options.headers["Authorization"] === "QB-TICKET mock-ticket-123"
      ) {
        return new Response(
          JSON.stringify({ temporaryAuthorization: "mock-temp-token-456" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`Unexpected getTempTokenDBID request: ${url}`);
    });

    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[QuickBase]: runQuery:", { url, options });
      if (
        url === `https://api.quickbase.com/v1/records/query` &&
        options.method === "POST" &&
        options.headers["Authorization"] === "QB-TEMP-TOKEN mock-temp-token-456"
      ) {
        return new Response(
          JSON.stringify({
            data: [{ 3: { value: "test" } }],
            metadata: { totalRecords: 1, numRecords: 1, skip: 0 },
            fields: [{ id: 3, label: "Field3", type: "text" }],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw new Error(`Unexpected runQuery request: ${url}`);
    });

    const ticketCache = new MockTicketCache<TicketData>();
    const spy = vi.spyOn(ticketCache, "set");
    const client = createClient(mockFetch, {
      useTicketAuth: true,
      ticketInMemorySessionSource: {
        initialCredentials: {
          username: process.env.QB_USERNAME!,
          password: process.env.QB_PASSWORD!,
        },
      },
      ticketCache,
    });

    const response = await client.runQuery({
      body: {
        from: QB_TABLE_ID_1,
        select: [3],
        options: { top: 1 },
      },
    });
    expect(response.data).toBeDefined();
    expect(spy).toHaveBeenCalledWith(
      "ticket",
      expect.objectContaining({
        ticket: "mock-ticket-123",
        cookies: expect.any(String),
      }),
      expect.any(Number)
    );
  });

  it(
    "proactively refreshes token when nearing expiration with ticketRefreshThreshold",
    { timeout: 5000 },
    async () => {
      const tokenCache = new TokenCache(300000);
      const ticketCache = new InMemoryCache<TicketData>();

      vi.spyOn(tokenCache, "get").mockReturnValue({
        token: "mock-temp-token-old",
        expiresAt: Date.now() + 30000,
      });

      const deleteSpy = vi.spyOn(tokenCache, "delete");
      const setSpy = vi.spyOn(tokenCache, "set");

      mockFetch.mockImplementationOnce(async (url, options) => {
        console.log("[QuickBase]: getTempTokenDBID (refresh):", {
          url,
          options,
        });
        if (
          url ===
            `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}` &&
          options.headers["Authorization"] === "QB-TICKET mock-ticket-123"
        ) {
          return new Response(
            JSON.stringify({ temporaryAuthorization: "mock-temp-token-new" }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        throw new Error(`Unexpected getTempTokenDBID request: ${url}`);
      });

      mockFetch.mockImplementationOnce(async (url, options) => {
        console.log("[QuickBase]: runQuery (new token):", { url, options });
        if (
          url === `https://api.quickbase.com/v1/records/query` &&
          options.method === "POST" &&
          options.headers["Authorization"] ===
            "QB-TEMP-TOKEN mock-temp-token-new"
        ) {
          return new Response(
            JSON.stringify({
              data: [{ 3: { value: "test" } }],
              metadata: { totalRecords: 1, numRecords: 1, skip: 0 },
              fields: [{ id: 3, label: "Field3", type: "text" }],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        throw new Error(`Unexpected runQuery request: ${url}`);
      });

      const client = createClient(mockFetch, {
        useTicketAuth: true,
        ticketInMemorySessionSource: {
          initialCredentials: {
            username: process.env.QB_USERNAME!,
            password: process.env.QB_PASSWORD!,
          },
        },
        ticketCache,
        tokenCache,
        ticketRefreshThreshold: 0.2,
        debug: true,
      });

      const response = await client.runQuery({
        body: {
          from: QB_TABLE_ID_1,
          select: [3],
          options: { top: 1 },
        },
      });

      expect(response.data).toBeDefined();
      expect(deleteSpy).toHaveBeenCalledWith(QB_TABLE_ID_1);
      expect(setSpy).toHaveBeenCalledWith(QB_TABLE_ID_1, "mock-temp-token-new");
      expect(response.data[0][3].value).toBe("test");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.quickbase.com/v1/records/query",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "QB-TEMP-TOKEN mock-temp-token-new",
          }),
        })
      );
    }
  );
});
