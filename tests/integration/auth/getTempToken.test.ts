// tests/integration/auth/getTempToken.test.ts
import { test, expect } from "@playwright/test";
import { quickbaseClient } from "../../../src/quickbaseClient.ts";
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

test.describe("QuickbaseClient Integration - getTempTokenDBID", () => {
  test("fetches a temporary token for an app from QuickBase and uses it to get the app", async ({
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

    const currentUrl = page.url();
    console.log("Post-login URL after app navigation:", currentUrl);

    // Create Quickbase client for getting the token
    const client = quickbaseClient({
      realm,
      withCredentials: true, // Needed for initial token fetch
      debug: true,
      fetchApi: async (url, init) => {
        try {
          const responseData = await page.evaluate(
            async ([fetchUrl, fetchInit]) => {
              const res = await fetch(fetchUrl, fetchInit);
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
            status: responseData.status,
            statusText: responseData.statusText,
            body: responseData.body,
          });

          const response = new Response(responseData.body || null, {
            status: responseData.status,
            statusText: responseData.statusText,
            headers: responseData.headers,
          });

          response.json = async () => {
            if (!responseData.body) {
              throw new Error("Empty response body from API");
            }
            try {
              return JSON.parse(responseData.body);
            } catch (e) {
              throw new SyntaxError(
                `Invalid JSON response: ${responseData.body}`
              );
            }
          };

          return response;
        } catch (error) {
          console.error(`Fetch error for ${url}:`, error);
          throw error;
        }
      },
    });

    // Get the temporary token for the app
    const tokenResult = await client.getTempTokenDBID({ dbid: appId });
    console.log("Token API response:", tokenResult);

    const token = tokenResult.temporaryAuthorization;
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    // Create a new client using the temporary token
    const clientWithToken = quickbaseClient({
      realm,
      tempToken: token,
      debug: true,
      fetchApi: async (url, init) => {
        console.log(`Fetching ${url} with init:`, init);
        const response = await fetch(url, init as RequestInit); // Use Node fetch
        const body = await response.text();

        console.log(`Raw response from ${url} with token:`, {
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
          if (!body) {
            throw new Error("Empty response body from API");
          }
          try {
            return JSON.parse(body);
          } catch (e) {
            throw new SyntaxError(`Invalid JSON response: ${body}`);
          }
        };

        return fetchResponse;
      },
    });

    // Use the token to get app details
    const appResult = await clientWithToken.getApp({ appId });
    console.log("App response using token:", appResult);

    // Validate the app response
    expect(appResult).toHaveProperty("id", appId);
    expect(appResult).toHaveProperty("name");
  });
});
