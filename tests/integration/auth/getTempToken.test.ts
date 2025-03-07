import { describe, it, expect } from "vitest";
import { quickbaseClient } from "../../../src/quickbaseClient.ts";

describe("QuickbaseClient Integration - getTempTokenDBID", () => {
  const config = {
    realm: process.env.QB_REALM || "",
    userToken: process.env.QB_USER_TOKEN || "",
    debug: true,
  };

  const client = quickbaseClient(config);

  it(
    "fetches a temporary token from QuickBase using user token",
    async () => {
      const dbid = process.env.QB_APP_ID || ""; // Use app ID instead of table ID
      if (!config.realm) throw new Error("QB_REALM is not defined in .env");
      if (!config.userToken)
        throw new Error("QB_USER_TOKEN is not defined in .env");
      if (!dbid) throw new Error("QB_APP_ID is not defined in .env");

      console.log("Config used:", {
        realm: config.realm,
        userToken: config.userToken.slice(0, 10) + "...",
        dbid,
      });

      try {
        const result = await client.getTempTokenDBID({ dbid });
        console.log("Real API response:", result);

        expect(result).toEqual({
          temporaryAuthorization: expect.stringMatching(/^b[0-9a-z_]+$/),
        });
      } catch (error) {
        console.error("API error:", error);
        throw error;
      }
    },
    { timeout: 10000 }
  );
});
