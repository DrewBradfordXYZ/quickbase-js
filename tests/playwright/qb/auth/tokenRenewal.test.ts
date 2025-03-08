// tests/integration/auth/tokenRenewal.test.ts
import { test, expect } from "@playwright/test";
import { quickbaseClient } from "../../../../src/quickbaseClient.ts";
import { tokenCache } from "../../../../src/tokenCache.ts";
import fetch from "node-fetch";
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

test.describe("QuickbaseClient Integration - Temp Token Renewal", () => {
  test("renews temp token after 5 minutes with getApp → wait → getApp sequence", async ({
    page,
  }) => {
    test.setTimeout(330000);

    const realm = process.env.QB_REALM;
    const appId = process.env.QB_APP_ID;
    const username = process.env.QB_USERNAME;
    const password = process.env.QB_PASSWORD;

    if (!realm) throw new Error("QB_REALM is not defined in .env");
    if (!appId) throw new Error("QB_APP_ID is not defined in .env");
    if (!username) throw new Error("QB_USERNAME is not defined in .env");
    if (!password) throw new Error("QB_PASSWORD is not defined in .env");

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
    console.log("Post-login URL after app navigation:", page.url());

    const browserFetch = async (url: string, init?: RequestInit) => {
      const response = await page.evaluate(
        async ([fetchUrl, fetchInit]) => {
          const res = await fetch(fetchUrl, {
            ...fetchInit,
            credentials: "include",
          });
          const body = await res.text();
          return {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            body,
          };
        },
        [url, init] as [string, RequestInit]
      );

      console.log(`Raw response from ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        body: response.body,
      });

      const fetchResponse = new Response(response.body || null, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      fetchResponse.json = async () => {
        if (!response.body) throw new Error("Empty response body from API");
        try {
          return JSON.parse(response.body);
        } catch (e) {
          throw new SyntaxError(`Invalid JSON response: ${response.body}`);
        }
      };

      return fetchResponse;
    };

    const client = quickbaseClient({
      realm,
      useTempTokens: true,
      debug: true,
      fetchApi: async (url, init) => {
        if (url.includes("/auth/temporary/")) {
          return browserFetch(url, init);
        }
        console.log(`Fetching ${url} with init:`, init);
        const response = await fetch(url, init as RequestInit);
        const body = await response.text();

        console.log(`Raw response from ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          body,
        });

        const fetchResponse = new Response(body || null, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        fetchResponse.json = async () => {
          if (!body) throw new Error("Empty response body from API");
          try {
            return JSON.parse(body);
          } catch (e) {
            throw new SyntaxError(`Invalid JSON response: ${body}`);
          }
        };

        return fetchResponse;
      },
    });

    tokenCache.clear();

    const appResult1 = await client.getApp({ appId });
    console.log("First getApp response:", appResult1);
    expect(appResult1).toHaveProperty("id", appId);
    expect(appResult1).toHaveProperty("name");

    const initialToken = tokenCache.get(appId);
    console.log("Initial token from cache:", initialToken);

    console.log("Waiting 5 minutes to test token expiration...");
    await new Promise((resolve) => setTimeout(resolve, 300000));

    await page.goto(`https://${realm}.quickbase.com/db/${appId}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    console.log("Refreshed page after 5 minutes, URL:", page.url());

    const appResult2 = await client.getApp({ appId });
    console.log("Second getApp response:", appResult2);
    expect(appResult2).toHaveProperty("id", appId);
    expect(appResult2).toHaveProperty("name");

    const renewedToken = tokenCache.get(appId);
    console.log("Renewed token from cache:", renewedToken);
    expect(renewedToken).not.toBe(initialToken);
  });
});
