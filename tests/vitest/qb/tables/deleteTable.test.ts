import { test, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";

test(
  "QuickbaseClient Integration - deleteTable > deletes a table in QuickBase",
  { timeout: 20000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
    };
    const client = quickbase(config);
    const appId = "buwai2zpe";

    // Step 1: Create a temporary table to delete
    const tableName = `DeleteTest_${Date.now()}`;
    const createBody = {
      name: tableName,
      description: "Temporary table for delete test",
      singleRecordName: "DeleteTest",
      pluralRecordName: "DeleteTests",
    };
    console.log("Creating temporary table with:", createBody);
    const createResponse = await client.createTable({
      appId,
      body: createBody,
    });
    expect(createResponse.id).toBeDefined();
    expect(createResponse.name).toBe(tableName);
    console.log("Created table:", createResponse);
    const tableId = createResponse.id;

    // Step 2: Delete the table
    console.log("Deleting table:", { tableId, appId });
    const deleteResponse = await client.deleteTable({ tableId, appId });
    expect(deleteResponse).toBeDefined();
    expect(deleteResponse.deletedTableId).toBe(tableId);
    console.log("Delete API response:", deleteResponse);

    // Step 3: Verify the table is gone
    try {
      await client.getTable({ tableId, appId });
      throw new Error("Table should not exist after deletion");
    } catch (error) {
      expect(error.message).toMatch(/404|not found/i); // Expect a 404 error
      console.log("Verified table deletion:", error.message);
    }
  }
);
