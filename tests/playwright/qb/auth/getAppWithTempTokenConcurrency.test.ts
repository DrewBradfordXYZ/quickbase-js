import { test, expect } from "@playwright/test";
import { quickbase } from "../../../../src/client/quickbaseClient.ts";
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

test.describe("QuickbaseClient Integration - getApp with Temporary Token Concurrency", () => {
  test("handles concurrent getApp requests with a single token fetch", async ({
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
      debug: true,
      fetchApi: async (url: RequestInfo | URL, init?: RequestInit) => {
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

    const concurrentRequests = [
      client.getApp({ appId }),
      client.getApp({ appId }),
      client.getApp({ appId }),
    ];

    await Promise.all([
      page.waitForResponse(`https://api.quickbase.com/v1/apps/${appId}`, {
        timeout: 30000,
      }),
      page.waitForResponse(`https://api.quickbase.com/v1/apps/${appId}`, {
        timeout: 30000,
      }),
      page.waitForResponse(`https://api.quickbase.com/v1/apps/${appId}`, {
        timeout: 30000,
      }),
    ]);

    const results = await Promise.all(concurrentRequests);

    const expectedAppData = {
      id: appId,
      name: "quickbase-js testing", // Updated to match actual app name
      created: expect.any(Date),
      updated: expect.any(Date),
      description: "",
      timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
      dateFormat: "MM-DD-YYYY",
      hasEveryoneOnTheInternet: false,
      memoryInfo: { estMemory: 0, estMemoryInclDependentApps: 0 },
      securityProperties: {
        allowClone: false,
        allowExport: true,
        enableAppTokens: true,
        hideFromPublic: false,
        mustBeRealmApproved: false,
        useIPFilter: false,
      },
      ancestorId: undefined,
      dataClassification: undefined,
      variables: [{ name: "TestVar", value: "TestValue" }],
    };

    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result).toEqual(expectedAppData);
    });

    const tokenFetchInits = fetchInits.filter((entry) =>
      entry.url.includes(`/auth/temporary/${appId}`)
    );
    expect(tokenFetchInits).toHaveLength(1);
    expect(tokenFetchInits[0].init.credentials).toBe("include");

    const appFetchInits = fetchInits.filter((entry) =>
      entry.url.includes(`/apps/${appId}`)
    );
    expect(appFetchInits).toHaveLength(3);
    appFetchInits.forEach((init) => {
      expect(init.init.credentials).toBe("omit");
      expect(init.init.headers).toHaveProperty("Authorization");
      expect(
        (init.init.headers as Record<string, string>)["Authorization"]
      ).toMatch(/^QB-TEMP-TOKEN .+$/);
    });

    console.log("Test completed. Check debug logs for concurrency details.");
  });
});
