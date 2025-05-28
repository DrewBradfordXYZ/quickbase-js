// tests/vitest/qb/auth/ticketInMemoryAuth.test.ts
import { test, expect, beforeAll, beforeEach } from "vitest";
import { vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_TABLE_ID_1,
  QB_APP_ID,
} from "@tests/setup";
import { TokenCache } from "../../../../src/cache/TokenCache";
import {
  LocalStorageTicketCache,
  TicketCacheEntry,
  TicketData,
} from "../../../../src/cache/TicketCache";
import { TicketInMemorySessionSource } from "../../../../src/auth/credential-sources/credentialSources";

beforeAll(() => {
  const requiredEnvVars = [
    "QB_REALM",
    "QB_USERNAME",
    "QB_PASSWORD",
    "QB_APP_TOKEN",
    "QB_TABLE_ID_1",
    "QB_APP_ID",
  ];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
});

beforeEach(() => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem("quickbase-ticket:ticket");
  }
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

test.skipIf(process.env.CI)(
  "QuickbaseClient Integration - runQuery with TicketInMemorySessionSource and 401 Retry Requiring Ticket Refresh (Mocked)",
  { timeout: 60000 },
  async () => {
    const realm = process.env.QB_REALM || "";
    const tableId = process.env.QB_TABLE_ID_1 || "";
    const appId = process.env.QB_APP_ID || "";
    const username = process.env.QB_USERNAME || "";
    const password = process.env.QB_PASSWORD || "";
    const appToken = process.env.QB_APP_TOKEN || "";

    if (!realm || !tableId || !appId || !username || !password || !appToken) {
      throw new Error(
        "QB_REALM, QB_TABLE_ID_1, QB_APP_ID, QB_USERNAME, QB_PASSWORD, and QB_APP_TOKEN must be set in .env"
      );
    }

    const tokenCache = new TokenCache(3600000); // 1 hour lifespan to avoid premature refreshes
    const ticketCache = new LocalStorageTicketCache<TicketData>();

    // Mock localStorage for tickets
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

    // Mock API_Authenticate (first ticket, 24 hours)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] API_Authenticate (first):", { url, options });
      if (
        url === `https://${realm}.quickbase.com/db/main` &&
        options.method === "POST" &&
        options.headers["QUICKBASE-ACTION"] === "API_Authenticate"
      ) {
        expect(options.body).toContain("<hours>24</hours>");
        return new Response(
          `<qdbapi><action>API_Authenticate</action><errcode>0</errcode><errtext>No error</errtext><ticket>integration-ticket-123</ticket></qdbapi>`,
          {
            status: 200,
            headers: {
              "Content-Type": "application/xml",
              "Set-Cookie": "TICKET=integration-ticket-123; Path=/;",
            },
          }
        );
      }
      throw new Error(`Unexpected API_Authenticate request: ${url}`);
    });

    // Mock getTempTokenDBID for appId (getApp)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] getTempTokenDBID (appId for getApp):", {
        url,
        options,
      });
      if (
        url === `https://api.quickbase.com/v1/auth/temporary/${appId}` &&
        options.headers["Authorization"] === "QB-TICKET integration-ticket-123"
      ) {
        return new Response(
          JSON.stringify({
            temporaryAuthorization: "integration-temp-token-app-456",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected getTempTokenDBID request: ${url}`);
    });

    // Mock getApp
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] getApp:", { url, options });
      if (
        url === `https://api.quickbase.com/v1/apps/${appId}` &&
        options.headers["Authorization"] ===
          "QB-TEMP-TOKEN integration-temp-token-app-456"
      ) {
        return new Response(
          JSON.stringify({ id: appId, name: "quickbase-js testing" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected getApp request: ${url}`);
    });

    // Mock getAppTables (reuses cached token)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] getAppTables:", { url, options });
      if (
        url === `https://api.quickbase.com/v1/tables?appId=${appId}` &&
        options.headers["Authorization"] ===
          "QB-TEMP-TOKEN integration-temp-token-app-456"
      ) {
        return new Response(
          JSON.stringify([{ id: tableId, name: "Test Table" }]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected getAppTables request: ${url}`);
    });

    // Mock getTempTokenDBID for tableId (getFields)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] getTempTokenDBID (tableId for getFields):", {
        url,
        options,
      });
      if (
        url === `https://api.quickbase.com/v1/auth/temporary/${tableId}` &&
        options.headers["Authorization"] === "QB-TICKET integration-ticket-123"
      ) {
        return new Response(
          JSON.stringify({
            temporaryAuthorization: "integration-temp-token-456",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected getTempTokenDBID request: ${url}`);
    });

    // Mock getFields
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] getFields:", { url, options });
      if (
        url === `https://api.quickbase.com/v1/fields?tableId=${tableId}` &&
        options.headers["Authorization"] ===
          "QB-TEMP-TOKEN integration-temp-token-456"
      ) {
        return new Response(
          JSON.stringify([{ id: 6, label: "Field6", type: "text" }]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected getFields request: ${url}`);
    });

    // Mock runQuery (401 error on first attempt, reuses cached token)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] runQuery (401):", { url, options });
      if (
        url === `https://api.quickbase.com/v1/records/query` &&
        options.method === "POST" &&
        options.headers["Authorization"] ===
          "QB-TEMP-TOKEN integration-temp-token-456"
      ) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized",
            description: "Invalid token",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected runQuery request: ${url}`);
    });

    // Mock getTempTokenDBID (401 error, triggers ticket refresh)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] getTempTokenDBID (401):", { url, options });
      if (
        url === `https://api.quickbase.com/v1/auth/temporary/${tableId}` &&
        options.headers["Authorization"] === "QB-TICKET integration-ticket-123"
      ) {
        return new Response(
          JSON.stringify({
            message: "Unauthorized",
            description: "Invalid ticket",
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected getTempTokenDBID request: ${url}`);
    });

    // Mock API_Authenticate (refreshed ticket, 24 hours)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] API_Authenticate (refresh):", { url, options });
      if (
        url === `https://${realm}.quickbase.com/db/main` &&
        options.method === "POST" &&
        options.headers["QUICKBASE-ACTION"] === "API_Authenticate"
      ) {
        expect(options.body).toContain("<hours>24</hours>");
        return new Response(
          `<qdbapi><action>API_Authenticate</action><errcode>0</errcode><errtext>No error</errtext><ticket>integration-ticket-789</ticket></qdbapi>`,
          {
            status: 200,
            headers: {
              "Content-Type": "application/xml",
              "Set-Cookie": "TICKET=integration-ticket-789; Path=/;",
            },
          }
        );
      }
      throw new Error(`Unexpected API_Authenticate request: ${url}`);
    });

    // Mock getTempTokenDBID (successful refresh)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] getTempTokenDBID (refresh):", { url, options });
      if (
        url === `https://api.quickbase.com/v1/auth/temporary/${tableId}` &&
        options.headers["Authorization"] === "QB-TICKET integration-ticket-789"
      ) {
        return new Response(
          JSON.stringify({
            temporaryAuthorization: "integration-temp-token-890",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected getTempTokenDBID request: ${url}`);
    });

    // Mock runQuery (successful retry)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] runQuery (retry):", { url, options });
      if (
        url === `https://api.quickbase.com/v1/records/query` &&
        options.method === "POST" &&
        options.headers["Authorization"] ===
          "QB-TEMP-TOKEN integration-temp-token-890"
      ) {
        return new Response(
          JSON.stringify({
            data: [{ 3: { value: 1 }, 6: { value: "integration-test" } }],
            metadata: { totalRecords: 1, numRecords: 1, skip: 0 },
            fields: [
              { id: 3, label: "Record ID#", type: "recordid" },
              { id: 6, label: "Field6", type: "text" },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected runQuery request: ${url}`);
    });

    const client = createClient(mockFetch, {
      realm,
      useTicketAuth: true,
      debug: true,
      ticketLifespanHours: 24,
      ticketCache,
      tokenCache,
      ticketInMemorySessionSource: {
        initialCredentials: { username, password, appToken },
        debug: true,
      },
    });

    try {
      // Validate getApp
      const appResponse = await client.getApp({ appId });
      expect(appResponse.id).toEqual(appId);
      console.log("[Integration] Validated app:", appResponse.name);

      // Validate getAppTables
      const tablesResponse = await client.getAppTables({ appId });
      const tableExists = tablesResponse.some((table) => table.id === tableId);
      expect(tableExists).toBe(
        true,
        `Table ${tableId} not found in app ${appId}`
      );
      console.log("[Integration] Validated table ID:", tableId);

      // Validate getFields
      const fieldsResponse = await client.getFields({ tableId });
      expect(fieldsResponse.length).toBeGreaterThan(
        0,
        "No fields found in table"
      );
      const fieldId = fieldsResponse[0].id;
      console.log("[Integration] Using field ID:", fieldId);

      // Validate runQuery with 401 retry
      const response = await client.runQuery({
        body: { from: tableId, select: [fieldId] },
      });

      expect(response.data).toBeDefined();
      expect(response.data).toEqual([
        { 3: { value: 1 }, 6: { value: "integration-test" } },
      ]);
      expect(response.metadata).toEqual({
        totalRecords: 1,
        numRecords: 1,
        skip: 0,
      });

      // Validate cached ticket
      const cachedEntry = localStorageMock.getItem("quickbase-ticket:ticket");
      expect(cachedEntry).toBeDefined();
      const parsedEntry: TicketCacheEntry<TicketData> = JSON.parse(
        cachedEntry!
      );
      expect(parsedEntry).toHaveProperty(
        "value.ticket",
        "integration-ticket-789"
      );

      console.log(
        "TicketInMemorySessionSource: Successfully executed runQuery with 401 retry requiring ticket refresh."
      );
    } catch (error) {
      console.error("[Integration] Error:", error);
      throw error;
    }
  }
);
