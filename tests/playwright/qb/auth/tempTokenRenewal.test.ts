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
  password: string,
  appUrl: string
): Promise<void> => {
  console.log("Logging in to QuickBase");
  await page.goto(quickbaseUrl, { timeout: 60000 });
  await page.waitForSelector("input[name='loginid']", { timeout: 60000 });
  await page.fill("input[name='loginid']", username);
  await page.fill("input[name='password']", password);
  await page.click("#signin");
  await page.waitForURL(`https://*.quickbase.com/**`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  console.log("Signed In to QuickBase.");
  await page.goto(appUrl, { waitUntil: "networkidle", timeout: 60000 });
  console.log("Navigated to app URL:", page.url());
};

test.describe("QuickbaseClient Integration - Temp Token Renewal", () => {
  test("renews temp token after 5 minutes with getApp → wait → getApp sequence", async ({
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

    const quickbaseUrl = `https://${realm}.quickbase.com/db/main?a=SignIn`;
    const appUrl = `https://${realm}.quickbase.com/db/${appId}`;

    await loginToQuickbase(page, quickbaseUrl, username, password, appUrl);

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

    console.log("Checking session state before getApp...");
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "TICKET" || c.name.startsWith("TICKET_")
    );
    console.log(
      "Session cookie present:",
      !!sessionCookie,
      "Cookies:",
      cookies
    );
    if (!sessionCookie) throw new Error("TICKET session cookie not found");

    await page.waitForTimeout(5000); // Debug delay
    console.log("Cookies after delay:", await page.context().cookies());

    const appResult1 = await client.getApp({ appId });
    console.log("First getApp response:", appResult1);
    expect(appResult1).toHaveProperty("id", appId);

    console.log("Waiting 5 minutes to test token expiration...");
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));

    await page.reload({ waitUntil: "load", timeout: 60000 });
    console.log("Refreshed page after 5 minutes, URL:", page.url());

    const appResult2 = await client.getApp({ appId });
    console.log("Second getApp response:", appResult2);
    expect(appResult2).toHaveProperty("id", appId);
  });
});
