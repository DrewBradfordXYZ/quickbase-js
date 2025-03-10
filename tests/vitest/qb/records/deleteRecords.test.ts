// tests/vitest/qb/records/deleteRecords.test.ts
import { expect, test } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";

// Initialize client with environment variables from .env
const qb = quickbase({
  realm:
    process.env.QB_REALM ||
    (() => {
      throw new Error("QB_REALM must be set in .env");
    })(),
  userToken:
    process.env.QB_USER_TOKEN ||
    (() => {
      throw new Error("QB_USER_TOKEN must be set in .env");
    })(),
  debug: true, // Helps debug API calls
});

// Assumes a test table exists; upserts a record and deletes it by Record ID
test("deleteRecords - deletes records matching query", async () => {
  const tableId = process.env.QB_TABLE_ID || ""; // Use 'Elements' table as per your output
  if (!tableId) throw new Error("QB_TABLE_ID must be set in .env");

  // Step 1: Upsert a new record without specifying Record ID
  const upsertResponse = await qb.upsert({
    body: {
      to: tableId,
      data: [{}], // Empty object to create a record with default values
    },
  });
  expect(upsertResponse.metadata.totalNumberOfRecordsProcessed).toBe(1);
  expect(upsertResponse.metadata.createdRecordIds.length).toBe(1);

  // Step 2: Get the new Record ID
  const newRecordId = upsertResponse.metadata.createdRecordIds[0];

  // Step 3: Delete the record using the Record ID
  const deleteResult = await qb.deleteRecords({
    body: {
      from: tableId,
      where: `{3.EX.${newRecordId}}`, // Query Record ID# (field 3)
    },
  });

  expect(deleteResult).toHaveProperty("numberDeleted");
  expect(typeof deleteResult.numberDeleted).toBe("number");
  expect(deleteResult.numberDeleted).toBe(1); // Expect exactly 1 record deleted
}, 10000); // Increased timeout for API calls

test("deleteRecords - handles empty result", async () => {
  const tableId = process.env.QB_TABLE_ID || "";
  if (!tableId) throw new Error("QB_TABLE_ID must be set in .env");

  const result = await qb.deleteRecords({
    body: {
      from: tableId,
      where: "{3.EX.'999999'}", // Query a non-existent Record ID
    },
  });

  expect(result.numberDeleted).toBe(0); // Should delete nothing
}, 10000); // Increased timeout for API call
