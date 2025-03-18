// tests/vitest/qb/formulas/runFormula.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createClient,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import {
  RunFormulaRequest,
  RunFormula200Response,
  Upsert200Response,
} from "@/generated/models";

describe("QuickbaseClient Integration - runFormula", () => {
  let client: ReturnType<typeof createClient>;
  let testRecordId: number;

  beforeAll(async () => {
    // Validate environment variables
    if (!QB_REALM) throw new Error("QB_REALM is not defined in .env");
    if (!QB_USER_TOKEN) throw new Error("QB_USER_TOKEN is not defined in .env");
    if (!QB_TABLE_ID_1) throw new Error("QB_TABLE_ID_1 is not defined in .env");

    // Initialize client with user token only
    client = createClient(undefined, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
    });

    // Upsert a test record to ensure we have a valid rid
    const upsertResponse: Upsert200Response = await client.upsert({
      body: {
        to: QB_TABLE_ID_1,
        data: [
          {
            "6": { value: `Test Record ${Date.now()}` }, // Assuming field 6 is a text field (e.g., "Task Name")
          },
        ],
        fieldsToReturn: [3], // Return Record ID# (field ID 3)
      },
    });

    // Extract the created record ID
    testRecordId = upsertResponse.data[0]["3"].value as number;
    console.log(`Upserted test record with ID: ${testRecordId}`);
  });

  afterAll(async () => {
    // Clean up the test record
    if (testRecordId) {
      await client.deleteRecords({
        body: {
          from: QB_TABLE_ID_1,
          where: `{3.EX.${testRecordId}}`, // Delete by Record ID#
        },
      });
      console.log(`Cleaned up test record with ID: ${testRecordId}`);
    }
  });

  it("runs simple formula without rid and returns correct result", async () => {
    const request: RunFormulaRequest = {
      from: QB_TABLE_ID_1,
      formula: "1 + 1", // Simple arithmetic to verify functionality
    };

    const response: RunFormula200Response = await client.runFormula({
      body: request,
    });

    console.log("Real API response (no rid):", response);

    expect(response).toHaveProperty("result");
    expect(response.result).toBe("2"); // Expect "2" as a string
  }, 10000);

  it("runs formula with rid and field ID 3, returns correct numeric result", async () => {
    const request: RunFormulaRequest = {
      from: QB_TABLE_ID_1,
      formula: "Sum([Record ID#], 20)", // Field ID 3 is "Record ID#"
      rid: testRecordId, // Use the upserted record ID
    };

    const response: RunFormula200Response = await client.runFormula({
      body: request,
    });

    console.log("Real API response (with rid):", response);

    expect(response).toHaveProperty("result");
    expect(response.result).toBe(String(testRecordId + 20)); // Dynamic result based on the record ID
  }, 10000);
});
