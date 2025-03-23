// tests/vitest/qb/fields/getFieldsUsage.test.ts
import { describe, it, expect } from "vitest";
import { createClient, QB_TABLE_ID_1 } from "../../../setup.ts";
import { FieldUsage } from "@/generated/models";

describe("QuickbaseClient Integration - getFieldsUsage", () => {
  const client = createClient();

  it("retrieves field usage statistics for a valid table", async () => {
    console.log("Starting retrieval of full field usage list");
    const response = await client.getFieldsUsage({
      tableId: QB_TABLE_ID_1,
    });

    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBeGreaterThan(0); // Assumes the table has fields
    response.forEach((usage: FieldUsage) => {
      expect(usage.field).toHaveProperty("id");
      expect(usage.field).toHaveProperty("name");
      expect(usage.field).toHaveProperty("type");
      expect(usage.usage).toHaveProperty("actions");
      expect(usage.usage.actions).toHaveProperty("count");
      expect(typeof usage.usage.actions.count).toBe("number");
      expect(usage.usage).toHaveProperty("dashboards");
      expect(usage.usage).toHaveProperty("forms");
      expect(usage.usage).toHaveProperty("reports");
    });
    console.log(
      `Retrieved ${response.length} field usage entries for table ${QB_TABLE_ID_1}`
    );
  }, 30000); // 15-second timeout

  it("retrieves field usage with skip and top parameters", async () => {
    console.log(
      "Starting retrieval of full field usage list for skip/top test"
    );
    const fullResponse = await client.getFieldsUsage({
      tableId: QB_TABLE_ID_1,
    });
    console.log(`Full list retrieved: ${fullResponse.length} fields`);

    const totalFields = fullResponse.length;
    if (totalFields <= 1) {
      console.log("Skipping skip/top test: table has too few fields");
      return; // Skip if not enough fields to test pagination
    }

    console.log("Starting retrieval with skip=1 and top=1");
    const response = await client.getFieldsUsage({
      tableId: QB_TABLE_ID_1,
      skip: 1,
      top: 1,
    });

    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBe(1); // Should return exactly 1 field
    expect(response[0].field.id).not.toBe(fullResponse[0].field.id); // Should skip the first field
    console.log(
      `Retrieved ${response.length} field usage entries with skip=1 and top=1`
    );
  }, 15000); // 15-second timeout

  it("fails with invalid table ID", async () => {
    const invalidTableId = "invalid_dbid";
    console.log(`Starting retrieval with invalid table ID ${invalidTableId}`);
    await expect(
      client.getFieldsUsage({
        tableId: invalidTableId,
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "API Error: Access denied (Status: 401)"
      ),
    });
    console.log(`Confirmed 401 for invalid table ID ${invalidTableId}`);
  }, 30000); // 15-second timeout
});
