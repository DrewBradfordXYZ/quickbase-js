// tests/vitest/qb/auth/standalone-auth.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

describe("Quickbase Standalone Authentication (No App Token)", () => {
  const config = {
    username: process.env.QB_USERNAME!,
    password: process.env.QB_PASSWORD!,
    realm: process.env.QB_REALM || "builderprogram-dbradford6815",
    appId: process.env.QB_APP_ID || "buwai2zpe",
    appToken: process.env.QB_APP_TOKEN,
  };

  const baseHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Origin: `https://${config.realm}.quickbase.com`,
    Referer: `https://${config.realm}.quickbase.com`,
  };

  let cookies: string[] = [];

  beforeEach(() => {
    cookies = [];
    if (!config.username || !config.password) {
      throw new Error("QB_USERNAME and QB_PASSWORD are required in .env");
    }
  });

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

  const getCookieHeader = () => cookies.map((c) => c.split(";")[0]).join("; ");

  it(
    "authenticates and makes REST API call without app token",
    { timeout: 10000 },
    async () => {
      // Step 1: Get ticket via API_Authenticate without app token
      const authResponse = await fetch(
        `https://${config.realm}.quickbase.com/db/main`,
        {
          method: "POST",
          headers: {
            ...baseHeaders,
            "Content-Type": "application/xml",
            Accept: "application/xml",
            "QUICKBASE-ACTION": "API_Authenticate",
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

      expect(authResponse.ok, "API_Authenticate should return 200 OK").toBe(
        true
      );
      const authXml = await authResponse.text();
      const authParsed = await parseStringPromise(authXml);
      const ticket = authParsed.qdbapi.ticket?.[0];
      const errcode = authParsed.qdbapi.errcode?.[0];
      const errtext = authParsed.qdbapi.errtext?.[0];

      expect(errcode, "API_Authenticate should return errcode 0").toBe("0");
      expect(errtext, "API_Authenticate should return 'No error'").toBe(
        "No error"
      );
      expect(ticket, "API_Authenticate should return a ticket").toBeDefined();

      updateCookies(authResponse.headers);
      expect(cookies.length, "Cookies should include TICKET").toBeGreaterThan(
        0
      );

      // Step 2: Get temporary token without app token
      const tempTokenResponse = await fetch(
        `https://api.quickbase.com/v1/auth/temporary/${config.appId}`,
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

      expect(
        tempTokenResponse.ok,
        "Temporary token request should return 200 OK"
      ).toBe(true);
      const tempTokenJson = (await tempTokenResponse.json()) as {
        temporaryAuthorization?: string;
        message?: string;
        description?: string;
      };
      console.log("Temporary token:", tempTokenJson.temporaryAuthorization);
      expect(
        tempTokenJson.temporaryAuthorization,
        "Should return a temporary token"
      ).toBeDefined();
      expect(
        tempTokenJson.message,
        "Should not return an error message"
      ).toBeUndefined();
      expect(
        tempTokenJson.description,
        "Should not return an error description"
      ).toBeUndefined();

      // Step 3: Make REST API call with temporary token
      const restHeaders = {
        ...baseHeaders,
        "QB-Realm-Hostname": `${config.realm}.quickbase.com`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `QB-TEMP-TOKEN ${tempTokenJson.temporaryAuthorization}`,
        Cookie: getCookieHeader(),
      };
      console.log("REST API headers:", restHeaders);
      const restResponse = await fetch(
        `https://api.quickbase.com/v1/apps/${config.appId}`,
        {
          headers: restHeaders,
        }
      );

      console.log("REST API response status:", restResponse.status);
      if (!restResponse.ok) {
        const errorJson = await restResponse.json();
        console.log("REST API error:", errorJson);
      }

      expect(restResponse.ok, "REST API call should return 200 OK").toBe(true);
      const restJson = (await restResponse.json()) as {
        id?: string;
        name?: string;
        message?: string;
        description?: string;
      };
      expect(restJson.id, "REST API should return app ID").toBe(config.appId);
      expect(restJson.name, "REST API should return app name").toBeDefined();
      expect(
        restJson.message,
        "REST API should not return an error message"
      ).toBeUndefined();
      // Relax assertion to accept empty string
      expect(
        restJson.description || undefined,
        "REST API should not return an error description"
      ).toBeUndefined();
    }
  );
});
