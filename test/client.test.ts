import { describe, it, expect, vi } from "vitest";
import { quickbaseClient } from "../src/quickbaseClient.ts";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

// Mock fetch to avoid real API calls
global.fetch = vi.fn((url, options) => {
  console.log("Mock fetch:", url, options);
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({ id: process.env.QB_APP_ID, name: "Mock App" }),
  } as Response);
});

describe("QuickbaseClient", () => {
  const client = quickbaseClient({
    realm: process.env.QB_REALM || "default-realm",
    userToken: process.env.QB_USER_TOKEN || "default-token",
    debug: true, // Enable debug
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has getApp method", () => {
    expect(typeof client.getApp).toBe("function");
  });

  it("calls getApp successfully", async () => {
    const appId = process.env.QB_APP_ID;
    if (!appId) throw new Error("QB_APP_ID is not defined in .env");
    console.log("Test appId:", appId); // Debug
    const result = await client.getApp({ appId });
    expect(result).toEqual({ id: appId, name: "Mock App" });
    expect(fetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${appId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
        }),
      })
    );
  });
});
