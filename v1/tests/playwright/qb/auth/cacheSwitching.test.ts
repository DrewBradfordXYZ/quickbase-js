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

      console.log("Navigating to login page");
      await page.goto(quickbaseUrl, { timeout: 30000 });
      console.log("Waiting for loginid selector");
      await page.waitForSelector("input[name='loginid']", { timeout: 30000 });
      await page.fill("input[name='loginid']", username);
      await page.fill("input[name='password']", password);
      console.log("Clicking signin");
      await page.click("#signin");
      console.log("Waiting for navigation");
      await page.waitForURL(`https://*.quickbase.com/**`, {
        waitUntil: "networkidle",
        timeout: 30000,
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

test.describe("QuickbaseClient Integration - Cache Switching with Temp Tokens", () => {
  test("caches and switches tokens for different DBIDs with getApp → getFields → getApp sequence", async ({
    page,
  }) => {
    console.log("Starting cacheSwitching test");
    const realm = process.env.QB_REALM ?? "";
    const appId = process.env.QB_APP_ID ?? "";
    const tableId = process.env.QB_TABLE_ID_1 ?? "";
    const username = process.env.QB_USERNAME ?? "";
    const password = process.env.QB_PASSWORD ?? "";

    if (!realm || !appId || !tableId || !username || !password) {
      throw new Error(
        "Required QuickBase environment variables are not defined"
      );
    }

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
      timeout: 30000,
    });
    console.log("Post-login URL after app navigation:", page.url());

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

    const appResult1 = await client.getApp({ appId });
    console.log("First getApp response:", appResult1);
    expect(appResult1).toHaveProperty("id", appId);

    const fieldsResult = await client.getFields({ tableId });
    console.log("getFields response:", fieldsResult);
    expect(fieldsResult.length).toBeGreaterThan(0);

    const appResult2 = await client.getApp({ appId });
    console.log("Second getApp response:", appResult2);
    expect(appResult2).toHaveProperty("id", appId);
  });
});
