// tests/vitest/qb/records/deleteRecords.test.ts
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { quickbase } from "@/quickbaseClient.ts";

const TABLE_ID = "buwai2zws";
const UNIQUE_FIELD_ID = 3; // Record ID field
const MARKER_FIELD_ID = 6; // Text field for marking test records

describe("QuickbaseClient - DeleteRecords Integration", () => {
  const qb = quickbase({
    realm: "builderprogram-dbradford6815",
    userToken: process.env.QB_USER_TOKEN,
    debug: true,
  });

  beforeEach(async () => {
    try {
      await qb.deleteRecords({
        body: {
          from: TABLE_ID,
          where: `{${MARKER_FIELD_ID}.CT.'test-marker-delete'}`,
        },
      });
    } catch (e) {
      // Ignore if no records exist
    }
  });

  afterEach(async () => {
    try {
      await qb.deleteRecords({
        body: {
          from: TABLE_ID,
          where: `{${MARKER_FIELD_ID}.CT.'test-marker-delete'}`,
        },
      });
    } catch (e) {}
  });

  test(
    "deletes a newly upserted record",
    async () => {
      const upsertResponse = await qb.upsert({
        body: {
          to: TABLE_ID,
          data: [{ [MARKER_FIELD_ID]: { value: "test-marker-delete" } }],
          fieldsToReturn: [UNIQUE_FIELD_ID], // Return record ID
        },
      });
      const recordId = upsertResponse.metadata.createdRecordIds[0];
      expect(recordId).toBeDefined();
      expect(upsertResponse.data[0][UNIQUE_FIELD_ID].value).toBe(recordId);

      const deleteResponse = await qb.deleteRecords({
        body: { from: TABLE_ID, where: `{${UNIQUE_FIELD_ID}.EX.${recordId}}` },
      });

      expect(deleteResponse).toEqual({ numberDeleted: 1 });

      const checkResponse = await qb.deleteRecords({
        body: { from: TABLE_ID, where: `{${UNIQUE_FIELD_ID}.EX.${recordId}}` },
      });
      expect(checkResponse.numberDeleted).toBe(0);
    },
    { timeout: 10000 }
  );

  test(
    "handles empty result when no records match",
    async () => {
      const response = await qb.deleteRecords({
        body: { from: TABLE_ID, where: "{3.EX.'999999'}" },
      });
      expect(response).toEqual({ numberDeleted: 0 });
    },
    { timeout: 10000 }
  );
});
