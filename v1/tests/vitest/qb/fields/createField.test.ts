import { describe, it, expect, afterAll } from "vitest";
import { createClient, QB_TABLE_ID_1 } from "../../../setup.ts";

describe("QuickbaseClient Integration - createField", () => {
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

  it("creates a field with user token", async () => {
    const uniqueLabel = `TestField_${Date.now()}`;
    const response = await client.createField({
      tableId: QB_TABLE_ID_1,
      body: {
        label: uniqueLabel,
        fieldType: "text",
        fieldHelp: "Created via integration test",
        addToForms: true,
      },
    });

    expect(response.id).toBeDefined();
    expect(response.label).toBe(uniqueLabel);
    expect(response.fieldType).toBe("text");
    expect(response.fieldHelp).toBe("Created via integration test");

    createdFieldIds.push(response.id);
    console.log(`Created field ${uniqueLabel} with ID ${response.id}`);
  });

  it("fails with invalid field type", async () => {
    const uniqueLabel = `InvalidField_${Date.now()}`;
    await expect(
      client.createField({
        tableId: QB_TABLE_ID_1,
        body: {
          label: uniqueLabel,
          fieldType: "invalid_type" as "text", // Type assertion to bypass compile-time check
          fieldHelp: "Should fail",
        },
      })
    ).rejects.toThrow("API Error: Bad Request (Status: 400)");
  }, 10000); // Increased timeout to 10 seconds

  it("fails with missing label", async () => {
    await expect(
      client.createField({
        tableId: QB_TABLE_ID_1,
        body: {
          label: "",
          fieldType: "text",
        },
      })
    ).rejects.toThrow("API Error: Invalid input (Status: 400)");
  });
});
