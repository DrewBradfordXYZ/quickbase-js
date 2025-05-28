import { test, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";

test(
  "QuickbaseClient Integration - getAppEvents > fetches real app events from QuickBase",
  { timeout: 10000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
    };
    const client = quickbase(config);
    const appId = "buwai2zpe"; // Same app ID as getApp test

    console.log("Config used:", config);
    const result = await client.getAppEvents({ appId });
    console.log("Real API response:", result);

    // Validate the response is an array of events
    expect(result).toBeInstanceOf(Array);

    // Check that each event has the required properties
    result.forEach((event) => {
      expect(event).toHaveProperty("type");
      expect([
        "qb-action",
        "webhook",
        "email-notification",
        "subscription",
        "reminder",
        "automation",
      ]).toContain(event.type);

      expect(event).toHaveProperty("owner");
      expect(event.owner).toHaveProperty("email");
      expect(typeof event.owner.email).toBe("string");
      expect(event.owner).toHaveProperty("id");
      expect(typeof event.owner.id).toBe("string");
      expect(event.owner).toHaveProperty("name");
      expect(typeof event.owner.name).toBe("string");
      // userName is optional, so we don't enforce it

      expect(event).toHaveProperty("isActive");
      expect(typeof event.isActive).toBe("boolean");

      expect(event).toHaveProperty("tableId");
      expect(typeof event.tableId).toBe("string");

      // Name is present for all types except automation
      if (event.type !== "automation") {
        expect(event).toHaveProperty("name");
        expect(typeof event.name).toBe("string");
      } else {
        expect(event.name).toBeUndefined();
      }

      // URL is only present for automation
      if (event.type === "automation") {
        expect(event).toHaveProperty("url");
        expect(typeof event.url).toBe("string");
      } else {
        expect(event.url).toBeUndefined();
      }
    });
  }
);
