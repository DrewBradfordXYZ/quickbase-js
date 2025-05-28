import { test, expect } from "@playwright/test";
import {
  quickbase,
  QuickbaseClient,
} from "../../../../src/client/quickbaseClient.ts";
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

test.describe("QuickbaseClient Integration - Token Invalidation with Cached Token", () => {
  test("retries with new token when cached token is unexpectedly invalidated", async ({
    page,
  }) => {
    // Type-safe environment variables
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

    // Track tokens and call counts
    let callCount = 0;
    let getAppCallCount = 0;
    let initialToken: string | null = null;
    let retryToken: string | null = null;
    const fetchInits: { url: string; init: RequestInit }[] = [];

    const client = quickbase({
      realm,
      useTempTokens: true,
      debug: true,
      fetchApi: async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input.toString();
        callCount++;
        console.log(`fetchApi called for ${url}, callCount: ${callCount}`);

        const effectiveInit = init || {};
        fetchInits.push({ url, init: effectiveInit });

        const response = await page.evaluate(
          async ([fetchUrl, fetchInit]: [string, RequestInit]) => {
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
          [url, effectiveInit] as [string, RequestInit]
        );

        // Simulate 401 for the first getApp call
        if (url.includes(`/apps/${appId}`)) {
          getAppCallCount++;
          console.log(`getApp call count: ${getAppCallCount}`);
          if (getAppCallCount === 1) {
            console.log("Simulating 401 Unauthorized for first getApp call");
            return new Response(JSON.stringify({ message: "Unauthorized" }), {
              status: 401,
              statusText: "Unauthorized",
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        const fetchResponse = new Response(response.body || null, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers),
        });

        // Override json() to parse the body correctly
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

        // Capture tokens for validation
        if (url.includes("/auth/temporary/")) {
          try {
            const json = await fetchResponse.clone().json();
            const token = json.temporaryAuthorization;
            if (!initialToken) {
              initialToken = token;
              console.log(`Captured initial token: ${initialToken}`);
            } else if (!retryToken) {
              retryToken = token;
              console.log(`Captured retry token: ${retryToken}`);
            }
          } catch (error) {
            console.error("Failed to parse token response:", error);
          }
        }

        console.log(`Raw response from ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          body: response.body,
        });

        return fetchResponse;
      },
    }) as QuickbaseClient;

    // Pre-fetch token to simulate cached token
    console.log("Pre-fetching initial token...");
    const preFetchResult = await client.getTempTokenDBID({ dbid: appId });
    console.log("Initial token pre-fetched and cached:", preFetchResult);

    // Call getApp, expecting a 401 followed by a retry with a new token
    const appPromise = client.getApp({ appId });
    await page.waitForResponse(`https://api.quickbase.com/v1/apps/${appId}`, {
      timeout: 30000,
    });
    const appResult = await appPromise;
    console.log("App response after token invalidation and retry:", appResult);

    // Validate the app response
    expect(appResult).toHaveProperty("id", appId);
    expect(appResult).toHaveProperty("name");

    // Verify call counts and token behavior
    console.log(
      `Final callCount: ${callCount}, Final getAppCallCount: ${getAppCallCount}`
    );
    expect(callCount).toBe(4); // Pre-fetch, 401, token retry, getApp success
    expect(getAppCallCount).toBe(2); // Initial 401, retry success

    // Validate pre-fetch and retry tokens
    console.log(`Initial token: ${initialToken}`);
    console.log(`Retry token: ${retryToken}`);
    expect(initialToken).toBeDefined();
    expect(initialToken).toBe(preFetchResult.temporaryAuthorization); // Confirm pre-fetch token was used
    expect(retryToken).toBeDefined();
    expect(initialToken).not.toBe(retryToken); // Confirm retry used a new token
  });
});
