// tests/vitest/qb/apps/deleteApp.test.ts
import { test, expect } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";

test(
  "QuickbaseClient Integration - deleteApp > deletes an app in QuickBase",
  { timeout: 30000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
      useTempTokens: false,
    };
    const client = quickbase(config);

    const appName = `TempApp_${Date.now()}`;
    const createBody = {
      name: appName,
      description: "Temporary app for deleteApp test",
      assignToken: true, // Match createApp.test.ts
    };

    console.log("Config used:", {
      ...config,
      userToken: config.userToken ? "[REDACTED]" : "",
    });
    console.log("Creating temporary app with:", createBody);
    const createStartTime = Date.now();
    let createResponse;
    try {
      createResponse = await client.createApp({ body: createBody });
      const createDuration = Date.now() - createStartTime;
      console.log(`createApp completed in ${createDuration}ms`);
      console.log("Created app response:", createResponse);

      expect(createResponse).toBeDefined();
      expect(createResponse.id).toBeDefined();
      expect(createResponse.name).toBe(appName);
    } catch (error) {
      const createDuration = Date.now() - createStartTime;
      console.error(`createApp failed after ${createDuration}ms:`, error);
      throw error;
    }

    const deleteBody = {
      name: appName,
    };
    console.log("Deleting app with:", deleteBody);
    const deleteStartTime = Date.now();
    try {
      const deleteResponse = await client.deleteApp({
        appId: createResponse.id,
        body: deleteBody,
      });
      const deleteDuration = Date.now() - deleteStartTime;
      console.log(`deleteApp completed in ${deleteDuration}ms`);
      console.log("Delete app response:", deleteResponse);

      expect(deleteResponse).toBeDefined();
      expect(deleteResponse.deletedAppId).toBe(createResponse.id);
    } catch (error) {
      const deleteDuration = Date.now() - deleteStartTime;
      console.error(`deleteApp failed after ${deleteDuration}ms:`, error);
      if (error instanceof Error && "response" in error) {
        try {
          const errorBody = await (error as any).response.json();
          console.error("Full deleteApp error response:", errorBody);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
      }
      throw error;
    }
  }
);
