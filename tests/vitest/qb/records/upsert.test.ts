// tests/vitest/qb/records/upsert.test.ts
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { quickbase } from "@/quickbaseClient.ts";

const TABLE_ID = "buwai2zws";
const MARKER_FIELD_ID = 6; // Text field for marking test records

describe("QuickbaseClient - Upsert Integration", () => {
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
          where: `{${MARKER_FIELD_ID}.CT.'test-marker-upsert'}`,
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
          where: `{${MARKER_FIELD_ID}.CT.'test-marker-upsert'}`,
        },
      });
    } catch (e) {}
  });

  test(
    "creates a new record successfully",
    async () => {
      const response = await qb.upsert({
        body: {
          to: TABLE_ID,
          data: [{ [MARKER_FIELD_ID]: { value: "test-marker-upsert" } }],
          fieldsToReturn: [MARKER_FIELD_ID, 3], // Return marker and record ID
        },
      });

      expect(response.metadata.createdRecordIds.length).toBe(1);
      expect(response.data).toHaveLength(1);
      expect(response.data[0][MARKER_FIELD_ID].value).toBe(
        "test-marker-upsert"
      );
      expect(response.data[0][3].value).toBeDefined(); // Record ID assigned by QuickBase
      expect(response.metadata.totalNumberOfRecordsProcessed).toBe(1);
    },
    { timeout: 10000 }
  );

  test(
    "handles empty data gracefully",
    async () => {
      await expect(
        qb.upsert({
          body: { to: TABLE_ID, data: [] },
        })
      ).rejects.toThrow("API Error: Bad Request (Status: 400)");
    },
    { timeout: 10000 }
  );
});
