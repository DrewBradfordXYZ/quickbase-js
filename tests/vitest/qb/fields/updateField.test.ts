// tests/vitest/qb/fields/updateField.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, QB_TABLE_ID_1 } from "../../../setup.ts";

describe("QuickbaseClient Integration - updateField", () => {
  const client = createClient();
  let fieldIdToUpdate: number;

  // Setup: Create a test field to update
  beforeAll(async () => {
    try {
      const response = await client.createField({
        tableId: QB_TABLE_ID_1,
        body: {
          label: "UpdateTestField",
          fieldType: "text",
          fieldHelp: "Test field for updating",
        },
      });
      fieldIdToUpdate = response.id;
      console.log(`Created field UpdateTestField with ID ${fieldIdToUpdate}`);
    } catch (error) {
      console.error("beforeAll failed:", error);
      throw error; // Fail the suite if setup fails
    }
  });

  // Teardown: Delete the test field
  afterAll(async () => {
    try {
      if (fieldIdToUpdate) {
        const response = await client.deleteFields({
          tableId: QB_TABLE_ID_1,
          body: { fieldIds: [fieldIdToUpdate] },
        });
        console.log(
          `Deleted field ${fieldIdToUpdate}:`,
          JSON.stringify(response, null, 2)
        );
      }
    } catch (error) {
      console.error("afterAll cleanup failed:", error);
      // Don’t throw here to avoid masking test results
    }
  });

  it(
    "updates a field successfully with user token",
    { timeout: 10000 },
    async () => {
      try {
        const updatedLabel = "UpdatedTestField";
        console.log("Sending updateField request at:", new Date());
        const response = await client.updateField({
          tableId: QB_TABLE_ID_1,
          fieldId: fieldIdToUpdate,
          body: {
            label: updatedLabel,
            fieldHelp: "Updated help text",
          },
        });
        console.log("updateField response received at:", new Date());
        console.log("Response:", JSON.stringify(response, null, 2));

        // Verify the update was successful
        expect(response).toBeDefined();
        expect(response.id).toBe(fieldIdToUpdate);
        expect(response.label).toBe(updatedLabel);
        expect(response.fieldHelp).toBe("Updated help text");
      } catch (error) {
        console.error("updateField failed:", error);
        throw error; // Re-throw to fail the test with details
      }
    }
  );

  it("fails with invalid field ID", { timeout: 10000 }, async () => {
    try {
      await expect(
        client.updateField({
          tableId: QB_TABLE_ID_1,
          fieldId: 999999, // Invalid field ID
          body: {
            label: "InvalidUpdate",
          },
        })
      ).rejects.toThrow("API Error: Item not found (Status: 404)"); // Updated to match actual error
    } catch (error) {
      console.error("updateField with invalid ID failed unexpectedly:", error);
      throw error;
    }
  });
});
