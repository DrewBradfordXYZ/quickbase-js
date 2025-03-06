import { describe, it, expect, vi } from "vitest";
import { quickbaseClient } from "../src/quickbaseClient";

// Mock fetch to avoid real API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: "mock-app", name: "Mock App" }),
  } as Response)
);

describe("QuickbaseClient", () => {
  const client = quickbaseClient({ realm: "test", userToken: "token" });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has getAppById method", () => {
    expect(typeof client.getApp).toBe("function");
  });

  it("calls getAppById successfully", async () => {
    const result = await client.getApp({ appId: "mock-app-id" });
    expect(result).toEqual({ id: "mock-app", name: "Mock App" });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.quickbase.com/v1/apps/mock-app-id",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "QB-USER-TOKEN token",
          "QB-Realm-Hostname": "test.quickbase.com",
        }),
      })
    );
  });
});
