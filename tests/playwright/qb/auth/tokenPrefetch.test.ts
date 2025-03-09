// tests/playwright/qb/auth/tokenPrefetch.test.ts
import { test, expect } from "@playwright/test";
import { quickbaseClient } from "../../../../src/quickbaseClient.ts";
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

test.describe("QuickbaseClient Integration - Token Pre-Fetch and Cache Reuse", () => {
  test("pre-fetches token and reuses it for subsequent API calls", async ({
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

    // Track tokens and call counts
    let callCount = 0;
    let cachedToken: string | null = null;

    const browserFetch = async (url: string, init?: RequestInit) => {
      console.log(`browserFetch called for ${url}, callCount: ${callCount}`);
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

      // Capture token from response
      if (url.includes("/auth/temporary/")) {
        const json = await fetchResponse.clone().json();
        const token = json.temporaryAuthorization;
        cachedToken = token; // Store the pre-fetched token
        console.log(`Captured pre-fetched token: ${cachedToken}`);
      }

      return fetchResponse;
    };

    const client = quickbaseClient({
      realm,
      useTempTokens: true,
      debug: true,
      fetchApi: async (url, init) => {
        callCount++;
        console.log(`fetchApi called for ${url}, callCount: ${callCount}`);

        if (url.includes("/auth/temporary/")) {
          return browserFetch(url, init); // Use browser fetch for temp tokens
        }

        // Use node-fetch for app calls, ensuring we track reuse
        console.log(`Fetching ${url} with init:`, init);
        const response = await fetch(url, init as RequestInit);
        const body = await response.text();

        console.log(`Raw response from ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          body,
        });

        return new Response(body || null, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });
      },
    });

    // Step 1: Pre-fetch token
    console.log("Pre-fetching token...");
    const tokenResult = await client.getTempTokenDBID({ dbid: appId });
    console.log("Pre-fetched token result:", tokenResult);
    expect(tokenResult).toHaveProperty("temporaryAuthorization");
    expect(cachedToken).toBe(tokenResult.temporaryAuthorization);

    // Step 2: Call getApp, expecting it to reuse the cached token
    console.log("Calling getApp with pre-fetched token...");
    const appResult = await client.getApp({ appId });
    console.log("App response:", appResult);

    // Validate the app response
    expect(appResult).toHaveProperty("id", appId);
    expect(appResult).toHaveProperty("name");

    // Verify call count and token reuse
    console.log(`Final callCount: ${callCount}`);
    expect(callCount).toBe(2); // One for pre-fetch, one for getApp
    expect(cachedToken).toBeDefined();

    // Check that getApp reused the token by inspecting logs manually or adding a header check if needed
    console.log(`Pre-fetched token: ${cachedToken}`);
  });
});
