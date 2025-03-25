import { describe, it, expect, beforeAll } from "vitest";
import {
  createClient,
  QB_TABLE_ID_1,
  QB_REALM,
  QB_USER_TOKEN,
} from "@tests/setup";
import { QuickbaseClient } from "@/quickbaseClient";
import {
  RunQueryRequest,
  RunQueryRequestOptions,
  RunQuery200Response,
} from "@/generated/models";

const skipFullTest = true; // Set to false to run the full test

describe("QuickbaseClient Integration - Pagination", () => {
  let qb: QuickbaseClient;

  beforeAll(() => {
    qb = createClient(undefined, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
      throttle: { type: "flow", rate: 6, burst: 50 },
      autoPaginate: false, // Disable auto-pagination for controlled test
    });
    console.log("[beforeAll] Client initialized");
  });

  it(
    "queries a small set of records with explicit top",
    { timeout: 10000 }, // 10s for fast, controlled test
    async () => {
      const queryOptions: RunQueryRequestOptions = {
        skip: 4000, // Fixed offset for consistency
        top: 500, // Explicit top for predictable fetch
      };

      const queryRequest: RunQueryRequest = {
        from: QB_TABLE_ID_1,
        select: [822, 823, 824, 825],
        options: queryOptions,
      };

      const startTime = Date.now();
      console.log(
        "[Test Start] Small Query request with explicit top:",
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
        });

        // Assertions
        expect(response.data).toBeDefined();
        expect(response.data.length).toBeGreaterThan(0);
        expect(response.data.length).toBeLessThanOrEqual(500);
        expect(response.data.length).toEqual(500);
        expect(response.metadata).toBeDefined();
        expect(response.metadata.totalRecords).toBeGreaterThan(500);
        expect(response.metadata.numFields).toBe(4);
        expect(response.metadata.skip).toBe(4000);
        expect(response.metadata.top).toBe(500);

        const sampleRecord = response.data[0];
        console.log("[Debug] Sample record:", sampleRecord);
        expect(sampleRecord["822"]?.value).toBeDefined();
        expect(typeof sampleRecord["822"]?.value).toBe("string");
        expect(
          sampleRecord["823"]?.value === "" ||
            sampleRecord["823"]?.value instanceof Date
        ).toBe(true);
        expect(sampleRecord["824"]?.value).toBeDefined();
        expect(
          typeof sampleRecord["824"]?.value === "number" ||
            sampleRecord["824"]?.value === null ||
            (typeof sampleRecord["824"]?.value === "object" &&
              typeof sampleRecord["824"]?.value?.value === "number")
        ).toBe(true);
        expect(sampleRecord["825"]?.value).toBeDefined();
        expect(typeof sampleRecord["825"]?.value).toBe("string");

        console.log(
          `[Integration Test] Fetched ${response.data.length} records in ${duration}ms`
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error("[Test Error] Failed after", duration, "ms:", error);
        throw error;
      }
    }
  );

  (skipFullTest ? it.skip : it)(
    "queries all records with production pagination logic",
    { timeout: 180000 },
    async () => {
      const queryRequest: RunQueryRequest = {
        from: QB_TABLE_ID_1,
        select: [822, 823, 824, 825],
      };

      const startTime = Date.now();
      console.log("[Test Start] Full Query request:", queryRequest);

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
            top: number | undefined;
          };
        };
        const duration = Date.now() - startTime;

        console.log(`[Test Complete] Full response received in ${duration}ms`, {
          recordCount: response.data?.length,
          totalRecords: response.metadata?.totalRecords,
        });

        expect(response.data).toBeDefined();
        expect(response.data.length).toBeGreaterThan(0);
        expect(response.data.length).toEqual(response.metadata.totalRecords);
        expect(response.metadata).toBeDefined();
        expect(response.metadata.totalRecords).toBeGreaterThan(100);
        expect(response.metadata.numFields).toBe(4);
        expect(response.metadata.skip).toBe(0);
        expect(response.metadata.top).toBeDefined();
        expect(response.metadata.top).toBeGreaterThan(0);

        const sampleRecord = response.data[0];
        console.log("[Debug] Sample record (full):", sampleRecord);
        expect(sampleRecord["822"]?.value).toBeDefined();
        expect(typeof sampleRecord["822"]?.value).toBe("string");
        expect(
          sampleRecord["823"]?.value === "" ||
            sampleRecord["823"]?.value instanceof Date
        ).toBe(true);
        expect(sampleRecord["824"]?.value).toBeDefined();
        expect(
          typeof sampleRecord["824"]?.value === "number" ||
            sampleRecord["824"]?.value === null ||
            (typeof sampleRecord["824"]?.value === "object" &&
              typeof sampleRecord["824"]?.value?.value === "number")
        ).toBe(true);
        expect(sampleRecord["825"]?.value).toBeDefined();
        expect(typeof sampleRecord["825"]?.value).toBe("string");

        const expectedPages = Math.ceil(
          response.metadata.totalRecords / response.metadata.top!
        );
        console.log(
          `[Integration Test] Full expected pages: ${expectedPages}, actual duration: ${duration}ms`
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(
          "[Test Error] Full test failed after",
          duration,
          "ms:",
          error
        );
        throw error;
      }
    }
  );
});
