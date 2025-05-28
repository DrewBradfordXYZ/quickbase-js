// tests/vitest/qb/apps/createApp.test.ts
import { test, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";

test(
  "QuickbaseClient Integration - createApp > creates a new app in QuickBase",
  { timeout: 30000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
      useTempTokens: false,
    };
    const client = quickbase(config);

    const appName = `TestApp_${Date.now()}`;
    const createBody = {
      name: appName,
      description: "Test app creation",
      assignToken: true,
    };

    console.log("Config used:", {
      ...config,
      userToken: config.userToken ? "[REDACTED]" : "",
    });
    console.log("Creating app with:", createBody);
    const createStartTime = Date.now();
    let response;
    try {
      response = await client.createApp({ body: createBody });
      const createDuration = Date.now() - createStartTime;
      console.log(`createApp completed in ${createDuration}ms`);
      console.log("Real API response:", response);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(appName);
      expect(response.description).toBe(createBody.description);
      expect(response.created).toBeInstanceOf(Date);
      expect(response.updated).toBeInstanceOf(Date);
      expect(response.dateFormat).toMatch(/^\w{2}-\w{2}-\w{4}$/);
      expect(typeof response.timeZone).toBe("string");
      expect(typeof response.hasEveryoneOnTheInternet).toBe("boolean");
      expect(
        response.dataClassification === undefined ||
          typeof response.dataClassification === "string"
      ).toBe(true);
      expect(
        response.variables === undefined || Array.isArray(response.variables)
      ).toBe(true);

      // Cleanup: Delete the app after assertions
      const deleteBody = { name: appName };
      await client.deleteApp({ appId: response.id, body: deleteBody });
      console.log("Cleanup: App deleted:", response.id);
    } catch (error) {
      const createDuration = Date.now() - createStartTime;
      console.error(`createApp failed after ${createDuration}ms:`, error);
      throw error;
    }
  }
);
