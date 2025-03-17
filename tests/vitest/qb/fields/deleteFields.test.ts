// tests/vitest/qb/fields/deleteFields.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, QB_TABLE_ID_1 } from "../../../setup.ts";

describe("QuickbaseClient Integration - deleteFields", () => {
  const client = createClient();
  let fieldIdsToDelete: number[] = [];

  beforeAll(async () => {
    try {
      const fieldLabels = ["DeleteTest1", "DeleteTest2"];
      for (const label of fieldLabels) {
        const response = await client.createField({
          tableId: QB_TABLE_ID_1,
          body: {
            label,
            fieldType: "text",
            fieldHelp: "Test field for deletion",
          },
        });
        fieldIdsToDelete.push(response.id);
        console.log(`Created field ${label} with ID ${response.id}`);
      }
      if (fieldIdsToDelete.length !== 2) {
        throw new Error("Failed to create all test fields");
      }
    } catch (error) {
      console.error("beforeAll failed:", error);
      throw error;
    }
  });

  it("deletes fields successfully with user token", async () => {
    try {
      const response = await client.deleteFields({
        tableId: QB_TABLE_ID_1,
        body: { fieldIds: fieldIdsToDelete },
      });
      console.log("deleteFields response:", JSON.stringify(response, null, 2));
      expect(response).toBeDefined();
      expect(response.deletedFieldIds).toEqual(
        expect.arrayContaining(fieldIdsToDelete)
      );
      expect(response.errors ?? []).toHaveLength(0);
    } catch (error) {
      console.error("deleteFields failed:", error);
      throw error;
    }
  });

  it("handles partial success with errors", { timeout: 10000 }, async () => {
    const newField = await client.createField({
      tableId: QB_TABLE_ID_1,
      body: { label: "DeleteTest3", fieldType: "text" },
    });
    console.log(`Created field DeleteTest3 with ID ${newField.id}`);

    const invalidFieldId = 999999;
    const fieldIds = [newField.id, invalidFieldId];

    console.log("Sending deleteFields request at:", new Date());
    const response = await client.deleteFields({
      tableId: QB_TABLE_ID_1,
      body: { fieldIds },
    });
    console.log("deleteFields response received at:", new Date());
    console.log("Response:", JSON.stringify(response, null, 2));

    expect(response.deletedFieldIds).toContain(newField.id);
    expect(response.deletedFieldIds).not.toContain(invalidFieldId);
    expect(response.errors).toHaveLength(1);
    expect(response.errors[0]).toMatch(/Field: 999999 was not found/i);
  });

  it("fails with invalid request (empty fieldIds)", async () => {
    await expect(
      client.deleteFields({
        tableId: QB_TABLE_ID_1,
        body: { fieldIds: [] },
      })
    ).rejects.toThrow("API Error: Bad Request (Status: 400)");
  });
});
