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
  "QuickbaseClient Integration - runQuery with TicketToken (Real API)",
  { timeout: 120000 },
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

    const client = quickbase({
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

      // Run simple query
      const response = await client.runQuery({
        body: { from: tableId, select: [fieldId] }, // No top: 1, no paginationLimit
      });

      expect(response.data).toBeDefined();
      expect(response.metadata).toBeDefined();
      expect(response.metadata.totalRecords).toBeGreaterThanOrEqual(0);
      expect(response.metadata.numRecords).toBeGreaterThanOrEqual(0);
      expect(response.metadata.skip).toEqual(0);

      console.log(
        "TicketTokenStrategy: Successfully executed runQuery with real Quickbase API."
      );
    } catch (error) {
      console.error("[Integration] Error:", error);
      if (error instanceof Error) {
        if (error.message.includes("getTempTokenDBID")) {
          console.error(
            "[Integration] Check QB_TABLE_ID_1, QB_APP_ID, credentials, or app token permissions. Ensure table ID is valid and accessible in the realm."
          );
        } else if (error.message.includes("Domain not allowed")) {
          console.error(
            "[Integration] Verify QB_REALM is correct and matches the app's realm. Check Quickbase domain restrictions."
          );
        }
      }
      throw error;
    }
  }
);

test(
  "QuickbaseClient Integration - runQuery with TicketToken (Mocked)",
  { timeout: 20000 },
  async () => {
    const realm = process.env.QB_REALM || "";
    const tableId = process.env.QB_TABLE_ID_1 || "";
    const username = process.env.QB_USERNAME || "";
    const password = process.env.QB_PASSWORD || "";
    const appToken = process.env.QB_APP_TOKEN || "";

    if (!realm || !tableId || !username || !password || !appToken) {
      throw new Error(
        "QB_REALM, QB_TABLE_ID_1, QB_USERNAME, QB_PASSWORD, and QB_APP_TOKEN must be set in .env"
      );
    }

    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] API_Authenticate:", { url, options });
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

    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] getTempTokenDBID:", { url, options });
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

    mockFetch.mockImplementationOnce(async (url, options) => {
      console.log("[mockFetch] runQuery:", { url, options });
      if (
        url === `https://api.quickbase.com/v1/records/query` &&
        options.method === "POST" &&
        options.headers["Authorization"] ===
          "QB-TEMP-TOKEN integration-temp-token-456"
      ) {
        return new Response(
          JSON.stringify({
            data: [{ 3: { value: "integration-test" } }],
            metadata: { totalRecords: 1, numRecords: 1, skip: 0 },
            fields: [{ id: 3, label: "Field3", type: "text" }],
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

    const response = await client.runQuery({
      body: { from: tableId, select: [3], options: { top: 1 } },
    });

    expect(response.data).toBeDefined();
    expect(response.data).toEqual([{ 3: { value: "integration-test" } }]);
    expect(response.metadata).toEqual({
      totalRecords: 1,
      numRecords: 1,
      skip: 0,
    });

    const cachedEntry = localStorageMock.getItem("quickbase-ticket:ticket");
    expect(cachedEntry).toBeDefined();
    const parsedEntry: TicketCacheEntry<TicketData> = JSON.parse(cachedEntry!);
    expect(parsedEntry).toHaveProperty(
      "value.ticket",
      "integration-ticket-123"
    );

    console.log("TicketTokenStrategy: Successfully executed mocked runQuery.");
  }
);
