import { test, expect, beforeAll, beforeEach } from "vitest";
import { vi } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";
import { createClient, mockFetch, QB_REALM, QB_TABLE_ID_1 } from "@tests/setup";
import { TicketCacheEntry } from "../../../../src/TicketCache";
import { TicketData } from "../../../../src/authorizationStrategy";

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
  // Clear any cached tickets to avoid interference
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem("quickbase-ticket:ticket");
  }
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

test.skipIf(process.env.CI)(
  "QuickbaseClient Integration - runQuery with 401 Retry (Mocked)",
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

    // Mock API_Authenticate (first ticket)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] API_Authenticate (first):", { url, options });
      if (
        url === `https://${realm}.quickbase.com/db/main` &&
        options.method === "POST" &&
        options.headers["QUICKBASE-ACTION"] === "API_Authenticate"
      ) {
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
      console.log("[mockFetch] getTempTokenDBID (appId):", { url, options });
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

    // Mock getAppTables
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
      console.log("[mockFetch] getTempTokenDBID (tableId):", { url, options });
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

    // Mock runQuery (401 error on first attempt)
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

    // Mock API_Authenticate (refreshed ticket)
    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] API_Authenticate (refresh):", { url, options });
      if (
        url === `https://${realm}.quickbase.com/db/main` &&
        options.method === "POST" &&
        options.headers["QUICKBASE-ACTION"] === "API_Authenticate"
      ) {
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

    // Mock getTempTokenDBID (refreshed token for tableId)
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
            data: [{ 6: { value: "integration-test" } }],
            metadata: { totalRecords: 1, numRecords: 1, skip: 0 },
            fields: [{ id: 6, label: "Field6", type: "text" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Unexpected runQuery request: ${url}`);
    });

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

    const client = createClient(mockFetch, {
      realm,
      credentials: { username, password, appToken },
      useTicketAuth: true,
      debug: true,
    });

    try {
      // Validate app
      const appResponse = await client.getApp({ appId });
      expect(appResponse.id).toEqual(appId);
      console.log("[Integration] Validated app:", appResponse.name);

      // Validate table exists in app
      const tablesResponse = await client.getAppTables({ appId });
      const tableExists = tablesResponse.some((table) => table.id === tableId);
      expect(tableExists).toBe(
        true,
        `Table ${tableId} not found in app ${appId}`
      );
      console.log("[Integration] Validated table ID:", tableId);

      // Get a valid field ID
      const fieldsResponse = await client.getFields({ tableId });
      expect(fieldsResponse.length).toBeGreaterThan(
        0,
        "No fields found in table"
      );
      const fieldId = fieldsResponse[0].id;
      console.log("[Integration] Using field ID:", fieldId);

      // Run query expecting 401 retry
      const response = await client.runQuery({
        body: { from: tableId, select: [fieldId] },
      });

      expect(response.data).toBeDefined();
      expect(response.data).toEqual([{ 6: { value: "integration-test" } }]);
      expect(response.metadata).toEqual({
        totalRecords: 1,
        numRecords: 1,
        skip: 0,
      });

      // Verify ticket refresh
      const cachedEntry = localStorageMock.getItem("quickbase-ticket:ticket");
      expect(cachedEntry).toBeDefined();
      const parsedEntry: TicketCacheEntry<TicketData> = JSON.parse(
        cachedEntry!
      );
      expect(parsedEntry).toHaveProperty(
        "value.ticket",
        "integration-ticket-789"
      ); // Refreshed ticket

      console.log(
        "TicketTokenStrategy: Successfully executed runQuery with 401 retry."
      );
    } catch (error) {
      console.error("[Integration] Error:", error);
      throw error;
    }
  }
);
