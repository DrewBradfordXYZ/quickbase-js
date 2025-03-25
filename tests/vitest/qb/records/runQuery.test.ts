import { describe, it, expect } from "vitest";
import { createClient, QB_TABLE_ID_1 } from "../../../setup.ts";
import {
  RunQueryRequest,
  RunQueryResponse,
  Upsert200Response,
  Upsert207Response,
} from "@/generated/models";

// Define a type for field data with a value property (matches generated Record type)
interface FieldData {
  value: any; // Adjust type based on your needs (e.g., string | number)
}

describe("QuickbaseClient Integration - runQuery", () => {
  let createdRecordId: number;

  it(
    "queries real records from QuickBase",
    async () => {
      const client = createClient();

      // Upsert a test record to query later
      const upsertResponse: Upsert200Response | Upsert207Response =
        await client.upsert({
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

      // Check metadata and createdRecordIds with null safety
      expect(
        upsertResponse.metadata,
        "Expected metadata to be defined"
      ).toBeDefined();
      expect(
        upsertResponse.metadata?.createdRecordIds,
        "Expected createdRecordIds to be defined"
      ).toBeDefined();

      const createdRecordIds = upsertResponse.metadata?.createdRecordIds;
      if (!createdRecordIds || createdRecordIds.length === 0) {
        throw new Error("Expected at least one created record ID from upsert");
      }

      createdRecordId = createdRecordIds[0];
      expect(
        createdRecordId,
        "Expected createdRecordId to be defined"
      ).toBeDefined();
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

      // Assertions with safety checks and type assertion
      expect(
        response.data,
        "Expected response.data to be defined"
      ).toBeDefined();
      if (!response.data || response.data.length === 0) {
        throw new Error(
          "Expected response.data to contain at least one record"
        );
      }

      expect(response.data).toHaveLength(1);
      const record = response.data[0] as { [key: string]: FieldData };
      expect(
        record["3"]?.value,
        "Expected field 3 to match createdRecordId"
      ).toBe(createdRecordId);
      expect(
        record["6"]?.value,
        "Expected field 6 to contain 'Test Task'"
      ).toContain("Test Task");

      expect(
        response.fields,
        "Expected response.fields to be defined"
      ).toBeDefined();
      if (!response.fields) {
        throw new Error("Expected response.fields to contain field metadata");
      }
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

      expect(
        response.metadata,
        "Expected response.metadata to be defined"
      ).toBeDefined();
      if (!response.metadata) {
        throw new Error("Expected response.metadata to be present");
      }
      expect(response.metadata).toMatchObject({
        numFields: 2,
        numRecords: 1,
        skip: 0,
        // Removed top: 1, as it should be undefined in the final response
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
