import { test, expect } from "@playwright/test";
import { quickbase, QuickbaseClient } from "../../../../src/quickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config();

const loginToQuickbase = async (
  page: import("@playwright/test").Page,
  quickbaseUrl: string,
  username: string,
  password: string
): Promise<boolean> => {
  console.log("Logging in to QuickBase");
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

test.describe("QuickbaseClient Integration - getApp with Temp Tokens", () => {
  test("uses temp tokens automatically for getApp in browser", async ({
    page,
  }) => {
    const realm = process.env.QB_REALM ?? "";
    const appId = process.env.QB_APP_ID ?? "";
    const username = process.env.QB_USERNAME ?? "";
    const password = process.env.QB_PASSWORD ?? "";

    if (!realm || !appId || !username || !password) {
      throw new Error(
        "Required QuickBase environment variables are not defined"
      );
    }

    // Login to QuickBase
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

    // Navigate to the app page to ensure session context
    await page.goto(`https://${realm}.quickbase.com/db/${appId}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    console.log("Post-login URL after app navigation:", page.url());

    // Single client with browser-based fetch
    const client = quickbase({
      realm,
      useTempTokens: true,
      debug: true,
      fetchApi: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();
        console.log(`Fetching ${url} with init:`, init);
        const effectiveInit = init || {};
        const response = await page.evaluate(
          async ([fetchUrl, fetchInit]: [string, RequestInit]) => {
            const res = await fetch(fetchUrl, fetchInit); // Rely on quickbaseClient.ts for credentials
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
          [url, effectiveInit] as [string, RequestInit]
        );

        console.log(`Raw response from ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          body: response.body,
        });

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
    }) as QuickbaseClient;

    // Call getApp directly, letting the library handle temp token logic
    const appResult = await client.getApp({ appId });
    console.log("App response using auto-fetched temp token:", appResult);

    // Validate the app response
    expect(appResult).toHaveProperty("id", appId);
    expect(appResult).toHaveProperty("name");
  });
});
