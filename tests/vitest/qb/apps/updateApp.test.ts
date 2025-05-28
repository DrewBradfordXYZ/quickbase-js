import { test, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";

test(
  "QuickbaseClient Integration - updateApp > updates real app data in QuickBase",
  { timeout: 10000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
    };
    const client = quickbase(config);
    const appId = "buwai2zpe"; // Same app ID as before

    // Original app data (to restore later if needed)
    const originalApp = await client.getApp({ appId });
    console.log("Original app data:", originalApp);

    // Update request
    const updateRequest = {
      name: "qb-copy-updated",
      description: "Updated via integration test",
      variables: [{ name: "TestVar", value: "TestValue" }],
    };

    console.log("Config used:", config);
    console.log("Update request:", updateRequest);
    const result = await client.updateApp({ appId, body: updateRequest });
    console.log("Real API response:", result);

    // Validate the response
    expect(result).toHaveProperty("id", appId);
    expect(result).toHaveProperty("name", "qb-copy-updated");
    expect(result).toHaveProperty(
      "description",
      "Updated via integration test"
    );
    expect(result).toHaveProperty("variables");
    expect(result.variables).toContainEqual({
      name: "TestVar",
      value: "TestValue",
    });
    expect(result).toHaveProperty("created");
    expect(result.created).toBeInstanceOf(Date);
    expect(result).toHaveProperty("updated");
    expect(result.updated).toBeInstanceOf(Date);

    // Optional: Restore original name to avoid permanent changes
    const restoreRequest = {
      name: originalApp.name,
      description: originalApp.description,
      variables: originalApp.variables,
    };
    await client.updateApp({ appId, body: restoreRequest });
    console.log("Restored app to:", originalApp.name);
  }
);
