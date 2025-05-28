import { test, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";

test(
  "QuickbaseClient Integration - updateTable > updates real table data in QuickBase",
  { timeout: 10000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
    };
    const client = quickbase(config);
    const appId = "buwai2zpe";
    const tableId = "buwai2zr4";
    const updatedBody = {
      name: "Root Updated " + Date.now(),
      description: "Integration test update",
    };
    const originalBody = {
      name: "Root",
      description: "",
    };

    console.log("Config used:", config);
    // Update the table
    const response = await client.updateTable({
      tableId,
      appId,
      body: updatedBody,
    });
    expect(response).toBeDefined();
    expect(response.id).toBe(tableId);
    expect(response.name).toBe(updatedBody.name);
    expect(response.description).toBe(updatedBody.description);
    console.log("Real API response:", response);

    // Cleanup: Revert the table to original state
    const cleanupResponse = await client.updateTable({
      tableId,
      appId,
      body: originalBody,
    });
    expect(cleanupResponse.name).toBe(originalBody.name);
    expect(cleanupResponse.description).toBe(originalBody.description);
    console.log("Cleanup API response:", cleanupResponse);
  }
);
