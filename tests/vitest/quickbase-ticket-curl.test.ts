// tests/vitest/quickbase-auth.test.ts
import { describe, it, expect } from "vitest";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

// Standalone Quickbase temporary token generation test suite
// Verifies API_Authenticate (XML API) and getTempTokenDBID (REST API) using curl-equivalent fetch calls
// Created: 05:24 PM EDT, May 27, 2025
// Author: Drew Bradford (based on Grok 3 assistance)

describe("Quickbase Temporary Token Authentication (Standalone)", () => {
  const config = {
    username: process.env.QB_USERNAME!,
    password: process.env.QB_PASSWORD!,
    realm: process.env.QB_REALM!,
    appToken: process.env.QB_APP_TOKEN!,
    tableDbid: process.env.QB_TABLE_DBID!,
  };

  const baseHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Origin: `https://${config.realm}.quickbase.com`,
    Referer: `https://${config.realm}.quickbase.com`,
  };

  let cookies: string[] = [];

  // Helper to update cookies from response headers
  const updateCookies = (headers: Headers) => {
    const setCookies =
      headers
        .get("set-cookie")
        ?.split(/,(?=\s*[^\s])/)
        .map((c) => c.trim()) || [];
    cookies = [
      ...cookies,
      ...setCookies.filter((c) => c.includes("TICKET") || c.includes("luid")),
    ];
  };

  // Helper to get cookie header
  const getCookieHeader = () => cookies.map((c) => c.split(";")[0]).join("; ");

  it(
    "obtains a ticket via API_Authenticate with app token",
    { timeout: 5000 },
    async () => {
      const response = await fetch(
        `https://${config.realm}.quickbase.com/db/main`,
        {
          method: "POST",
          headers: {
            ...baseHeaders,
            "Content-Type": "application/xml",
            Accept: "application/xml",
            "QUICKBASE-ACTION": "API_Authenticate",
            "QB-App-Token": config.appToken,
          },
          body: `<?xml version="1.0" ?>
             <qdbapi>
               <username>${config.username}</username>
               <password>${config.password}</password>
               <hours>24</hours>
               <udata>auth_request</udata>
             </qdbapi>`,
        }
      );

      expect(response.ok, "API_Authenticate request should return 200 OK").toBe(
        true
      );
      const xml = await response.text();
      const parsed = await parseStringPromise(xml);
      const ticket = parsed.qdbapi.ticket?.[0];
      const errcode = parsed.qdbapi.errcode?.[0];
      const errtext = parsed.qdbapi.errtext?.[0];

      expect(errcode, "API_Authenticate should return errcode 0").toBe("0");
      expect(errtext, 'API_Authenticate should return "No error"').toBe(
        "No error"
      );
      expect(ticket, "API_Authenticate should return a ticket").toBeDefined();

      updateCookies(response.headers);
      expect(cookies.length, "Cookies should include TICKET").toBeGreaterThan(
        0
      );
    }
  );

  it(
    "obtains a temporary token via getTempTokenDBID without app token",
    { timeout: 5000 },
    async () => {
      // Get ticket
      const authResponse = await fetch(
        `https://${config.realm}.quickbase.com/db/main`,
        {
          method: "POST",
          headers: {
            ...baseHeaders,
            "Content-Type": "application/xml",
            Accept: "application/xml",
            "QUICKBASE-ACTION": "API_Authenticate",
            "QB-App-Token": config.appToken,
          },
          body: `<?xml version="1.0" ?>
             <qdbapi>
               <username>${config.username}</username>
               <password>${config.password}</password>
               <hours>24</hours>
               <udata>auth_request</udata>
             </qdbapi>`,
        }
      );

      expect(
        authResponse.ok,
        "API_Authenticate request should return 200 OK"
      ).toBe(true);
      const authXml = await authResponse.text();
      const authParsed = await parseStringPromise(authXml);
      const ticket = authParsed.qdbapi.ticket?.[0];

      expect(ticket, "API_Authenticate should return a ticket").toBeDefined();
      updateCookies(authResponse.headers);

      // Get temporary token
      const response = await fetch(
        `https://api.quickbase.com/v1/auth/temporary/${config.tableDbid}`,
        {
          headers: {
            ...baseHeaders,
            "QB-Realm-Hostname": `${config.realm}.quickbase.com`,
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `QB-TICKET ${ticket}`,
            Cookie: getCookieHeader(),
          },
        }
      );

      expect(response.ok, "getTempTokenDBID request should return 200 OK").toBe(
        true
      );
      const json = (await response.json()) as {
        temporaryAuthorization?: string;
        message?: string;
        description?: string;
      };
      expect(
        json.temporaryAuthorization,
        "getTempTokenDBID should return a temporary token"
      ).toBeDefined();
      expect(
        json.message,
        "getTempTokenDBID should not return an error message"
      ).toBeUndefined();
      expect(
        json.description,
        "getTempTokenDBID should not return an error description"
      ).toBeUndefined();
    }
  );
});
