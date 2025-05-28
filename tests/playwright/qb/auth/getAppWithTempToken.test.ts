// tests/playwright/qb/auth/getAppWithTempToken.test.ts
import { test, expect } from "@playwright/test";
import { quickbase } from "../../../../src/client/quickbaseClient.ts"; // Keep .ts for now
import dotenv from "dotenv";

dotenv.config();

const loginToQuickbase = async (
  page: import("@playwright/test").Page,
  quickbaseUrl: string,
  username: string,
  password: string
): Promise<boolean> => {
  let loginSuccess = false;
  const maxLoginAttempts = 3;
  let loginAttempt = 0;

  while (!loginSuccess && loginAttempt < maxLoginAttempts) {
    try {
      loginAttempt++;
      if (loginAttempt > 1) console.log(`Login attempt ${loginAttempt}`);

      await page.goto(quickbaseUrl, { timeout: 60000 });
      await page.waitForSelector("input[name='loginid']", { timeout: 60000 });
      await page.fill("input[name='loginid']", username);
      await page.fill("input[name='password']", password);
      await page.click("#signin");
      await page.waitForURL(`https://*.quickbase.com/**`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });

      const loginError = await page.$(".login-error");
      if (loginError) {
        throw new Error("Login failed. Please check your credentials.");
      }

      console.log("Signed In to QuickBase.");
      loginSuccess = true;
    } catch (error) {
      console.error(
        `Login attempt ${loginAttempt} failed: ${(error as Error).message}`
      );
      if (loginAttempt >= maxLoginAttempts) {
        console.error("Max login attempts reached. Exiting.");
        await page.context().browser()!.close();
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  return loginSuccess;
};

test.describe("QuickbaseClient Integration - getApp with Temporary Token", () => {
  test("uses temporary token with correct credentials settings in browser", async ({
    page,
  }) => {
    const realm = process.env.QB_REALM;
    const appId = process.env.QB_APP_ID;
    const username = process.env.QB_USERNAME;
    const password = process.env.QB_PASSWORD;

    if (!realm) throw new Error("QB_REALM is not defined in .env");
    if (!appId) throw new Error("QB_APP_ID is not defined in .env");
    if (!username) throw new Error("QB_USERNAME is not defined in .env");
    if (!password) throw new Error("QB_PASSWORD is not defined in .env");

    const fetchInits: { url: string; init: RequestInit }[] = [];

    const quickbaseUrl = `https://${realm}.quickbase.com/db/main?a=SignIn`;
    const loginSuccess = await loginToQuickbase(
      page,
      quickbaseUrl,
      username,
      password
    );
    if (!loginSuccess) {
      throw new Error("Failed to log in to QuickBase after max attempts.");
    }

    await page.goto(`https://${realm}.quickbase.com/db/${appId}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    const client = quickbase({
      realm,
      useTempTokens: true,
      fetchApi: async (url: RequestInfo | URL, init?: RequestInit) => {
        // Use optional init and provide default empty object if undefined
        const effectiveInit = init || {};
        fetchInits.push({ url: String(url), init: effectiveInit });
        const response = await page.evaluate(
          async (args: [string, RequestInit]) => {
            const [fetchUrl, fetchInit] = args;
            const res = await fetch(fetchUrl, fetchInit);
            const body = await res.text();
            const headersObj: Record<string, string> = {};
            res.headers.forEach((value, key) => {
              headersObj[key] = value;
            });
            return {
              ok: res.ok,
              status: res.status,
              statusText: res.statusText,
              headers: headersObj,
              body,
            };
          },
          [String(url), effectiveInit] as [string, RequestInit]
        );

        const fetchResponse = new Response(response.body || null, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers),
        });

        fetchResponse.json = async () => {
          if (!response.body) {
            throw new Error("Empty response body from API");
          }
          try {
            return JSON.parse(response.body);
          } catch (e) {
            throw new SyntaxError(`Invalid JSON response: ${response.body}`);
          }
        };

        return fetchResponse;
      },
    });

    const appPromise = client.getApp({ appId });
    await page.waitForResponse(`https://api.quickbase.com/v1/apps/${appId}`, {
      timeout: 30000,
    });
    const appResult = await appPromise;

    expect(appResult).toHaveProperty("id", appId);
    expect(appResult).toHaveProperty("name");

    const tokenFetchInit = fetchInits.find((entry) =>
      entry.url.includes(`/auth/temporary/${appId}`)
    );
    expect(
      tokenFetchInit,
      "No fetch init captured for token request"
    ).toBeDefined();
    expect(tokenFetchInit!.init.credentials).toBe("include");

    const appFetchInit = fetchInits.find((entry) =>
      entry.url.includes(`/apps/${appId}`)
    );
    expect(
      appFetchInit,
      "No fetch init captured for getApp request"
    ).toBeDefined();
    expect(appFetchInit!.init.credentials).toBe("omit");
  });
});
