// tests/vitest/qb/quickbase-js/paginationControl.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";
import { RunQueryRequest, RunQuery200Response } from "@/generated/models";

describe("QuickbaseClient Unit - Pagination Control", () => {
  let client: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
      autoPaginate: true, // Default enabled
    });
  });

  it("paginates runQuery by default when autoPaginate is true", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () =>
          Promise.resolve({
            data: Array(2).fill({ "3": { value: "record1" } }),
            metadata: {
              totalRecords: 6,
              numRecords: 2,
              numFields: 1,
              skip: 0,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () =>
          Promise.resolve({
            data: Array(2).fill({ "3": { value: "record2" } }),
            metadata: {
              totalRecords: 6,
              numRecords: 2,
              numFields: 1,
              skip: 2,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () =>
          Promise.resolve({
            data: Array(2).fill({ "3": { value: "record3" } }),
            metadata: {
              totalRecords: 6,
              numRecords: 2,
              numFields: 1,
              skip: 4,
            },
          }),
      });

    const queryRequest: RunQueryRequest = {
      from: QB_TABLE_ID_1,
      select: [3],
      options: { top: 2 },
    };

    const result = await client.runQuery({ body: queryRequest });

    expect(mockFetch).toHaveBeenCalledTimes(3); // 6 records / 2 per call = 3 requests
    expect(result.data.length).toBe(6);
    expect((result.metadata as { totalRecords: number }).totalRecords).toBe(6);
    expect((result.metadata as { numRecords: number }).numRecords).toBe(6);
  });

  it("respects temporary disable of pagination for runQuery", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => {
        const response = {
          data: Array(2).fill({ "3": { value: "record1" } }),
          metadata: {
            totalRecords: 6,
            numRecords: 2,
            numFields: 1,
            skip: 0,
          },
        };
        console.log("[Second Test] First response:", response);
        return response;
      },
    });

    const queryRequest: RunQueryRequest = {
      from: QB_TABLE_ID_1,
      select: [3],
      options: { top: 2 },
    };

    const result = await client.withPaginationDisabled(() =>
      client.runQuery({ body: queryRequest })
    );

    expect(mockFetch).toHaveBeenCalledTimes(1); // Only one fetch
    expect(result.data.length).toBe(2); // Only the first 2 records
    expect((result.metadata as { numRecords: number }).numRecords).toBe(2);
    expect((result.metadata as { totalRecords: number }).totalRecords).toBe(6);
  });

  it("limits pagination to 100 records with withPaginationLimit", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () =>
          Promise.resolve({
            data: Array.from({ length: 25 }, (_, i) => ({
              "3": { value: `record${i + 1}` },
            })),
            metadata: {
              totalRecords: 1000,
              numRecords: 25,
              numFields: 1,
              skip: 0,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () =>
          Promise.resolve({
            data: Array.from({ length: 25 }, (_, i) => ({
              "3": { value: `record${i + 26}` },
            })),
            metadata: {
              totalRecords: 1000,
              numRecords: 25,
              numFields: 1,
              skip: 25,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () =>
          Promise.resolve({
            data: Array.from({ length: 25 }, (_, i) => ({
              "3": { value: `record${i + 51}` },
            })),
            metadata: {
              totalRecords: 1000,
              numRecords: 25,
              numFields: 1,
              skip: 50,
            },
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        json: () =>
          Promise.resolve({
            data: Array.from({ length: 25 }, (_, i) => ({
              "3": { value: `record${i + 76}` },
            })),
            metadata: {
              totalRecords: 1000,
              numRecords: 25,
              numFields: 1,
              skip: 75,
            },
          }),
      });

    const queryRequest: RunQueryRequest = {
      from: QB_TABLE_ID_1,
      select: [3],
      options: { top: 25 },
    };

    const result = await client.withPaginationLimit(100, () =>
      client.runQuery({ body: queryRequest })
    );

    expect(mockFetch).toHaveBeenCalledTimes(4); // 100 records / 25 per call = 4 requests
    expect(result.data.length).toBe(100);
    expect((result.metadata as { numRecords: number }).numRecords).toBe(100);
    expect((result.metadata as { totalRecords: number }).totalRecords).toBe(
      1000
    );
  });

  it("withPaginationLimit returns all results without pagination when top equals limit", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: () =>
        Promise.resolve({
          data: Array.from({ length: 100 }, (_, i) => ({
            "3": { value: `record${i + 1}` },
          })),
          metadata: {
            totalRecords: 100,
            numRecords: 100,
            numFields: 1,
            skip: 0,
          },
        }),
    });

    const queryRequest: RunQueryRequest = {
      from: QB_TABLE_ID_1,
      select: [3],
      options: { top: 100 },
    };

    const result = await client.withPaginationLimit(100, () =>
      client.runQuery({ body: queryRequest })
    );

    expect(mockFetch).toHaveBeenCalledTimes(1); // Only one fetch, no pagination needed
    expect(result.data.length).toBe(100);
    expect((result.metadata as { numRecords: number }).numRecords).toBe(100);
    expect((result.metadata as { totalRecords: number }).totalRecords).toBe(
      100
    );
  });
});
