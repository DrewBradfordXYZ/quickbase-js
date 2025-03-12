// tests/vitest/qb/fields/getField.test.ts
import { describe, it, expect } from "vitest";
import { createClient, QB_TABLE_ID_1 } from "../../../setup.ts";

describe("QuickbaseClient Integration - getField", () => {
  const client = createClient();

  it("retrieves an existing field with user token", async () => {
    // Create a field to ensure we have a known field ID to retrieve
    const uniqueLabel = `TestField_${Date.now()}`;
    const createResponse = await client.createField({
      tableId: QB_TABLE_ID_1,
      body: {
        label: uniqueLabel,
        fieldType: "text",
        fieldHelp: "Created for getField integration test",
        addToForms: true,
      },
    });

    expect(createResponse.id).toBeDefined();
    const fieldId = createResponse.id;
    console.log(`Created field ${uniqueLabel} with ID ${fieldId} for testing`);

    // Test getField with the created field
    const response = await client.getField({
      fieldId: fieldId,
      tableId: QB_TABLE_ID_1,
      includeFieldPerms: true,
    });

    expect(response.id).toBe(fieldId);
    expect(response.label).toBe(uniqueLabel);
    expect(response.fieldType).toBe("text");
    expect(response.fieldHelp).toBe("Created for getField integration test");
    expect(response.permissions).toBeDefined();
    expect(Array.isArray(response.permissions)).toBe(true);
    console.log(`Retrieved field ${response.label} with ID ${response.id}`);

    // Clean up the created field
    try {
      const deleteResponse = await client.deleteFields({
        tableId: QB_TABLE_ID_1,
        body: { fieldIds: [fieldId] },
      });
      console.log(
        `Cleaned up field ${fieldId}: ${JSON.stringify(deleteResponse)}`
      );
    } catch (error) {
      console.error(`Failed to clean up field ${fieldId}:`, error);
    }
  }, 10000); // Increase timeout to 10 seconds

  it("fails with non-existent field ID", async () => {
    const nonExistentFieldId = 999999; // Assuming this ID doesn’t exist
    await expect(
      client.getField({
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

  it("fails with invalid table ID", async () => {
    const invalidTableId = "invalid_dbid";
    await expect(
      client.getField({
        fieldId: 1, // Arbitrary field ID
        tableId: invalidTableId,
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "API Error: Invalid request (Status: 400)"
      ),
    });
    console.log(`Confirmed 400 for invalid table ID ${invalidTableId}`);
  });
});
