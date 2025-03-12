// tests/vitest/qb/fields/getFieldUsage.test.ts
import { describe, it, expect, afterAll } from "vitest";
import {
  createClient,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "../../../setup.ts";
import { FieldUsage } from "@/generated/models";

describe("QuickbaseClient Integration - getFieldUsage", () => {
  const client = createClient();
  const createdFieldIds: number[] = [];

  afterAll(async () => {
    if (createdFieldIds.length > 0) {
      try {
        const response = await client.deleteFields({
          tableId: QB_TABLE_ID_1,
          body: { fieldIds: createdFieldIds },
        });
        console.log(
          `Cleaned up fields: ${JSON.stringify(response.deletedFieldIds)}`,
          response.errors && response.errors.length > 0
            ? `Errors: ${response.errors}`
            : ""
        );
      } catch (error) {
        console.error("Cleanup failed:", error);
        console.log(`Fields left in table: ${createdFieldIds}`);
      }
    } else {
      console.log("No fields to clean up.");
    }
  });

  it(
    "creates a field, retrieves its usage statistics, and deletes it",
    async () => {
      // Step 1: Create a field
      const uniqueLabel = `TestField_${Date.now()}`;
      console.log("Creating field with label:", uniqueLabel);
      const createResponse = await client.createField({
        tableId: QB_TABLE_ID_1,
        body: {
          label: uniqueLabel,
          fieldType: "text",
          fieldHelp: "Created for getFieldUsage integration test",
          addToForms: true,
        },
      });

      expect(createResponse.id).toBeDefined();
      const fieldId = createResponse.id;
      createdFieldIds.push(fieldId);
      console.log(`Created field ${uniqueLabel} with ID ${fieldId}`);

      // Brief delay to ensure field is registered
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Get field usage with raw response logging
      console.log("Fetching field usage for:", {
        tableId: QB_TABLE_ID_1,
        fieldId,
      });
      const rawResponse = await fetch(
        `https://api.quickbase.com/v1/fields/usage/${fieldId}?tableId=${QB_TABLE_ID_1}`,
        {
          method: "GET",
          headers: {
            "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
            Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      const rawBody = await rawResponse.text();
      console.log("Raw API response:", {
        status: rawResponse.status,
        statusText: rawResponse.statusText,
        body: rawBody,
      });

      const responseArray: FieldUsage[] = await client.getFieldUsage({
        fieldId,
        tableId: QB_TABLE_ID_1,
      });
      console.log("Parsed API response (array):", responseArray);

      // Validate response structure (unwrap the array)
      expect(responseArray).toBeDefined();
      expect(responseArray).toHaveLength(1); // Expect a single-item array
      const response = responseArray[0];

      expect(response).toBeDefined();
      expect(response.field).toHaveProperty("id", fieldId);
      expect(response.field).toHaveProperty("name", uniqueLabel);
      expect(response.field).toHaveProperty("type", "text");
      expect(typeof response.field.name).toBe("string");
      expect(typeof response.field.type).toBe("string");

      expect(response.usage).toBeDefined();
      expect(typeof response.usage).toBe("object");
      expect(response.usage).toHaveProperty("actions");
      expect(response.usage.actions).toHaveProperty("count");
      expect(typeof response.usage.actions.count).toBe("number");
      expect(response.usage).toHaveProperty("appHomePages");
      expect(response.usage).toHaveProperty("dashboards");
      expect(response.usage).toHaveProperty("defaultReports");
      expect(response.usage).toHaveProperty("exactForms");
      expect(response.usage).toHaveProperty("fields");
      expect(response.usage).toHaveProperty("forms");
      expect(response.usage).toHaveProperty("notifications");
      expect(response.usage).toHaveProperty("personalReports");
      expect(response.usage).toHaveProperty("pipelines");
      expect(response.usage).toHaveProperty("relationships");
      expect(response.usage).toHaveProperty("reminders");
      expect(response.usage).toHaveProperty("reports");
      expect(response.usage).toHaveProperty("roles");
      expect(response.usage).toHaveProperty("tableImports");
      expect(response.usage).toHaveProperty("tableRules");
      expect(response.usage).toHaveProperty("webhooks");

      // Since it’s a new field, expect minimal usage
      expect(response.usage.forms.count).toBeGreaterThanOrEqual(0); // May be 1 if addToForms worked
    },
    { timeout: 30000 } // 30-second timeout for create + get + delete
  );

  it("fails with non-existent field ID", { timeout: 15000 }, async () => {
    const nonExistentFieldId = 999999;

    console.log("Attempting to fetch usage for non-existent field:", {
      tableId: QB_TABLE_ID_1,
      fieldId: nonExistentFieldId,
    });
    await expect(
      client.getFieldUsage({
        fieldId: nonExistentFieldId,
        tableId: QB_TABLE_ID_1,
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "API Error: No such field (Status: 404)"
      ),
    });

    console.log(
      `Confirmed 404 for non-existent field ID ${nonExistentFieldId}`
    );
  });

  it("fails with invalid table ID", { timeout: 15000 }, async () => {
    const invalidTableId = "invalid_dbid";
    const fieldId = 6;

    console.log("Attempting to fetch usage with invalid table ID:", {
      tableId: invalidTableId,
      fieldId,
    });
    await expect(
      client.getFieldUsage({
        fieldId,
        tableId: invalidTableId,
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "API Error: Access denied (Status: 401)"
      ),
    });

    console.log(`Confirmed 401 for invalid table ID ${invalidTableId}`);
  });
});
