// tests/playwright/qb/auth/tokenRenewal.test.ts
import { test, expect } from "@playwright/test";
import { quickbase } from "../../../../src/quickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config();

const loginToQuickbase = async (
  page,
  quickbaseUrl,
  username,
  password,
  appUrl
) => {
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
    const realm = process.env.QB_REALM!;
    const appId = process.env.QB_APP_ID!;
    const username = process.env.QB_USERNAME!;
    const password = process.env.QB_PASSWORD!;
    const quickbaseUrl = `https://${realm}.quickbase.com/db/main?a=SignIn`;
    const appUrl = `https://${realm}.quickbase.com/db/${appId}`;

    await loginToQuickbase(page, quickbaseUrl, username, password, appUrl);

    const browserFetch = async (
      url: string,
      init: RequestInit
    ): Promise<Response> => {
      const response = await page.request.fetch(url, {
        method: init.method || "GET",
        headers: {
          ...init.headers,
          Referer: `https://${realm}.quickbase.com/db/${appId}`,
          Origin: `https://${realm}.quickbase.com`,
        },
        data: init.body,
        credentials: "include",
      });
      const body = await response.text();
      console.log(
        "Response from:",
        url,
        "status:",
        response.status(),
        "body:",
        body
      );
      return new Response(body, {
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
      });
    };

    const client = quickbase({
      realm,
      useTempTokens: true,
      debug: true,
      fetchApi: browserFetch,
    });

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
    expect(appResult1.id).toBe(appId);

    console.log("Waiting 5 minutes to test token expiration...");
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));

    await page.reload({ waitUntil: "load", timeout: 60000 });
    console.log("Refreshed page after 5 minutes, URL:", page.url());

    const appResult2 = await client.getApp({ appId });
    console.log("Second getApp response:", appResult2);
    expect(appResult2.id).toBe(appId);
  });
});
