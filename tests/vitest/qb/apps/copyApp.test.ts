// tests/vitest/qb/apps/copyApp.test.ts
import { test, expect } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";

test(
  "QuickbaseClient Integration - copyApp > creates a new copied app in QuickBase",
  { timeout: 30000 }, // Increased to 30 seconds
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
    };
    const client = quickbase(config);
    const appId = process.env.QB_APP_ID || ""; // The source app ID to copy from

    const copyAppName = `CopiedApp_${Date.now()}`; // Unique name to avoid conflicts
    const copyBody = {
      name: copyAppName,
      description: "Test copied app",
      properties: {
        keepData: false,
        excludeFiles: true,
        usersAndRoles: false,
        assignUserToken: true,
      },
    };

    console.log("Config used:", {
      ...config,
      userToken: config.userToken ? "[REDACTED]" : "", // Avoid logging sensitive token
    });
    console.log("Copying app with:", copyBody);
    const startTime = Date.now();
    let response;
    try {
      response = await client.copyApp({ appId, body: copyBody });
      const duration = Date.now() - startTime;
      console.log(`copyApp completed in ${duration}ms`);
      console.log("Real API response:", response);

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toBe(copyAppName);
      expect(response.description).toBe(copyBody.description);
      expect(response.created).toBeInstanceOf(Date);
      expect(response.updated).toBeInstanceOf(Date);
      expect(response.dateFormat).toMatch(/^\w{2}-\w{2}-\w{4}$/); // e.g., "MM-DD-YYYY"
      expect(typeof response.timeZone).toBe("string"); // Simplified to check if it’s a string
      expect(typeof response.hasEveryoneOnTheInternet).toBe("boolean");
      expect(response.ancestorId).toBe(appId); // Should match the source app ID
      expect(
        response.dataClassification === undefined ||
          typeof response.dataClassification === "string"
      ).toBe(true); // Allow undefined or string
      expect(
        response.variables === undefined || Array.isArray(response.variables)
      ).toBe(true); // Allow undefined or array
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`copyApp failed after ${duration}ms:`, error);
      throw error; // Re-throw to fail the test
    }

    // Cleanup note: No direct REST API to delete app
    console.log(
      "Cleanup note: No direct REST API to delete app. Manually delete app with ID:",
      response.id
    );
  }
);
