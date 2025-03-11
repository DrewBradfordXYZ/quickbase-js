// tests/vitest/qb/records/runQuery.test.ts
import { describe, it, expect } from "vitest";
import { createClient, QB_TABLE_ID_1 } from "../../../setup.ts"; // Import QB_TABLE_ID_1
import { RunQueryRequest, RunQueryResponse } from "@/generated/models";

describe("QuickbaseClient Integration - runQuery", () => {
  let createdRecordId: number;

  it(
    "queries real records from QuickBase",
    async () => {
      const client = createClient();

      // Upsert a test record to query later
      const upsertResponse = await client.upsert({
        body: {
          to: QB_TABLE_ID_1,
          data: [
            {
              "6": { value: "Test Task " + Date.now() }, // Assuming field 6 is a text field
            },
          ],
          fieldsToReturn: [3, 6], // Record ID# and the text field
        },
      });
      createdRecordId = upsertResponse.metadata.createdRecordIds[0];
      console.log("Created test record with ID:", createdRecordId);

      // Query the record
      const queryRequest: RunQueryRequest = {
        from: QB_TABLE_ID_1,
        select: [3, 6], // Query Record ID# and the text field
        where: `{3.EX.${createdRecordId}}`, // Filter by the created record
        sortBy: [{ fieldId: 6, order: "ASC" }],
        options: { skip: 0, top: 1 },
      };

      console.log("Config used:", {
        realm: process.env.QB_REALM,
        userToken: process.env.QB_USER_TOKEN,
        tableId: QB_TABLE_ID_1,
      });
      console.log("Query request:", queryRequest);
      const response: RunQueryResponse = await client.runQuery({
        body: queryRequest,
      });
      console.log("Real API response:", response);

      // Assertions
      expect(response.data).toHaveLength(1);
      expect(response.data[0]["3"].value).toBe(createdRecordId);
      expect(response.data[0]["6"].value).toContain("Test Task");
      expect(response.fields).toContainEqual({
        id: 3,
        label: expect.any(String),
        type: expect.any(String),
      });
      expect(response.fields).toContainEqual({
        id: 6,
        label: expect.any(String),
        type: expect.any(String),
      });
      expect(response.metadata).toMatchObject({
        numFields: 2,
        numRecords: 1,
        skip: 0,
        top: 1,
        totalRecords: expect.any(Number),
      });

      // Cleanup: Delete the test record
      await client.deleteRecords({
        body: {
          from: QB_TABLE_ID_1,
          where: `{3.EX.${createdRecordId}}`, // Assuming field 3 is Record ID#
        },
      });
      console.log("Cleaned up test record with ID:", createdRecordId);
    },
    { timeout: 10000 }
  );
});
