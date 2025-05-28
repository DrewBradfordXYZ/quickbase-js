import { describe, it, expect, beforeAll } from "vitest";
import {
  createClient,
  QB_TABLE_ID_1,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup";
import { QuickbaseClient } from "@/client/quickbaseClient";
import {
  RunQueryRequest,
  RunQueryRequestOptions,
  RunQuery200Response,
} from "@/generated/models";

describe("QuickbaseClient Integration - Pagination with Skip", () => {
  let qb: QuickbaseClient;

  beforeAll(() => {
    qb = createClient(undefined, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
      autoPaginate: true, // Enable library's automatic pagination
    });
    console.log("[beforeAll] Client initialized");
  });

  it(
    "fetches full dataset with auto-pagination and heavy data",
    { timeout: 120000 }, // 120s to handle 55k+ records
    async () => {
      const queryOptions: RunQueryRequestOptions = {
        skip: 0, // Start at beginning
        top: 1000, // Explicit page size to control pagination
      };

      const queryRequest: RunQueryRequest = {
        from: QB_TABLE_ID_1,
        select: [3, 822, 823, 824, 825, 6], // FID 3 for Record ID
        options: queryOptions,
      };

      const startTime = Date.now();
      console.log(
        "[Test Start] Query request with auto-pagination:",
        queryRequest
      );

      try {
        const response = (await qb.runQuery({
          body: queryRequest,
        })) as RunQuery200Response & {
          data: Array<{ [key: string]: { value: any } }>;
          metadata: {
            totalRecords: number;
            numRecords: number;
            numFields: number;
            skip: number;
            top?: number;
          };
        };

        const duration = Date.now() - startTime;
        console.log(`[Test Complete] Response received in ${duration}ms`, {
          recordCount: response.data.length,
          totalRecords: response.metadata.totalRecords,
          fetchedTop: response.metadata.top,
        });

        // Assertions
        expect(response.data).toBeDefined();
        expect(response.data.length).toBeGreaterThan(2429); // More than initial cap
        expect(response.data.length).toEqual(response.metadata.totalRecords); // Full dataset fetched
        expect(response.metadata).toBeDefined();
        expect(response.metadata.totalRecords).toBeGreaterThanOrEqual(5000); // Flexible minimum
        expect(response.metadata.numFields).toBe(6); // 6 fields
        expect(response.metadata.skip).toBe(0); // Initial skip

        const sampleRecord = response.data[0];
        console.log("[Debug] Sample record:", sampleRecord);
        expect(sampleRecord["6"]?.value).toBeDefined();
        expect(typeof sampleRecord["6"]?.value).toBe("string");
        expect(sampleRecord["6"]?.value.length).toBeGreaterThan(9000); // ~10KB
        expect(sampleRecord["3"]?.value).toBeDefined();
        expect(typeof sampleRecord["3"]?.value).toBe("number");

        // Check for duplicates using Record ID (FID 3)
        const recordIds = response.data.map(
          (record: { [key: string]: { value: any } }) => record["3"]?.value
        );
        const uniqueRecordIds = new Set(recordIds);
        expect(uniqueRecordIds.size).toEqual(response.data.length); // No duplicates
        expect(uniqueRecordIds.size).toEqual(response.metadata.totalRecords); // All unique

        console.log(
          `[Integration Test] Fetched ${response.data.length} records in ${duration}ms, totalRecords: ${response.metadata.totalRecords}`
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error("[Test Error] Failed after", duration, "ms:", error);
        throw error;
      }
    }
  );
});
