import { test, expect } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";

test(
  "QuickbaseClient Integration - createTable > creates a new table in QuickBase",
  { timeout: 10000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "",
      userToken: process.env.QB_USER_TOKEN || "",
      debug: true,
    };
    const client = quickbase(config);
    const appId = "buwai2zpe";

    const tableName = `TestTable_${Date.now()}`;
    const createBody = {
      name: tableName,
      description: "Test table creation",
      singleRecordName: "TestRecord",
      pluralRecordName: "TestRecords",
    };

    console.log("Config used:", config);
    console.log("Creating table with:", createBody);
    const response = await client.createTable({ appId, body: createBody });

    expect(response).toBeDefined();
    expect(response.id).toBeDefined();
    expect(response.name).toBe(tableName);
    expect(response.description).toBe(createBody.description);
    expect(response.singleRecordName).toBe(createBody.singleRecordName);
    expect(response.pluralRecordName).toBe(createBody.pluralRecordName);
    expect(response.alias).toMatch(/^_DBID_/);
    expect(response.created).toBeInstanceOf(Date);
    expect(response.updated).toBeInstanceOf(Date);
    expect(response.nextRecordId).toBeGreaterThanOrEqual(1);
    expect(response.nextFieldId).toBeGreaterThanOrEqual(1);
    expect(response.defaultSortFieldId).toBeGreaterThanOrEqual(0);
    expect(response.keyFieldId).toBeGreaterThanOrEqual(1);
    expect(response.sizeLimit).toMatch(/^\d+\sMB$/); // e.g., "500 MB"
    expect(response.spaceUsed).toMatch(/^\d+\s(KB|MB)$/); // e.g., "0 KB"
    expect(response.spaceRemaining).toMatch(/^\d+\sMB$/); // e.g., "500 MB"

    console.log("Real API response:", response);

    // Cleanup: Delete the table to avoid clutter
    const deleteResponse = await client.deleteTable({
      tableId: response.id,
      appId,
    });
    expect(deleteResponse.deletedTableId).toBe(response.id);
    console.log("Cleanup - Deleted table:", deleteResponse);
  }
);
