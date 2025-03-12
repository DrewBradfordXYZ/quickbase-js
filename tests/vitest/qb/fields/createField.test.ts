// tests/vitest/qb/fields/createField.test.ts
import { describe, it, expect } from "vitest";
import { createClient, QB_TABLE_ID_1 } from "../../../setup.ts";

describe("QuickbaseClient Integration - createField", () => {
  const client = createClient();

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
  });

  it("fails with invalid field type", async () => {
    await expect(
      client.createField({
        tableId: QB_TABLE_ID_1,
        body: {
          label: `InvalidField_${Date.now()}`,
          fieldType: "invalid_type", // Should fail
          fieldHelp: "Should fail",
        },
      })
    ).rejects.toThrow("API Error: Bad Request (Status: 400)");
  });

  it("fails with missing label", async () => {
    await expect(
      client.createField({
        tableId: QB_TABLE_ID_1,
        body: {
          label: "", // Invalid
          fieldType: "text",
        },
      })
    ).rejects.toThrow("API Error: Invalid input (Status: 400)");
  });
});
