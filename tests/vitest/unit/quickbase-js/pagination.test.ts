// test/vitest/unit/pagination.test.ts
import { describe, it, expect, vi } from "vitest";
import { paginateRecords, isPaginatable } from "@/pagination";
import { QuickbaseClient } from "@/quickbaseClient";
import { RateLimiter } from "@/rateLimiter"; // Lowercase
import { FlowThrottleBucket } from "@/FlowThrottleBucket";
import { BurstAwareThrottleBucket } from "@/BurstAwareThrottleBucket";
import * as invokeMethodModule from "@/invokeMethod"; // Import module for mocking

describe("Pagination Unit Tests", () => {
  it("fetches all pages with FlowThrottleBucket", async () => {
    const throttleBucket = new FlowThrottleBucket(10, 50); // Rate 10, Burst 50
    const rateLimiter = new RateLimiter(throttleBucket);
    const methodMap = {
      getRecords: {
        api: {},
        method: vi.fn(),
        paramMap: ["tableId"],
        httpMethod: "GET",
      },
    } as any;

    // Mock invokeMethod directly
    const mockInvoke = vi
      .spyOn(invokeMethodModule, "invokeMethod")
      .mockResolvedValueOnce({
        data: Array(25).fill({ id: "record" }),
        metadata: {
          totalRecords: 100,
          numRecords: 25,
          numFields: 3,
          skip: 0,
          top: 25,
        },
      })
      .mockResolvedValueOnce({
        data: Array(25).fill({ id: "record" }),
        metadata: {
          totalRecords: 100,
          numRecords: 25,
          numFields: 3,
          skip: 25,
          top: 25,
        },
      })
      .mockResolvedValueOnce({
        data: Array(25).fill({ id: "record" }),
        metadata: {
          totalRecords: 100,
          numRecords: 25,
          numFields: 3,
          skip: 50,
          top: 25,
        },
      })
      .mockResolvedValueOnce({
        data: Array(25).fill({ id: "record" }),
        metadata: {
          totalRecords: 100,
          numRecords: 25,
          numFields: 3,
          skip: 75,
          top: 25,
        },
      });

    const result = await paginateRecords(
      "getRecords",
      { tableId: "mock-table" },
      methodMap,
      {},
      { getToken: vi.fn(), applyHeaders: vi.fn(), handleError: vi.fn() } as any,
      rateLimiter,
      (obj: any) => obj,
      false,
      true
    );

    expect(mockInvoke).toHaveBeenCalledTimes(4);
    expect(result.data.length).toBe(100);
    expect(result.metadata).toEqual({
      totalRecords: 100,
      numRecords: 100,
      numFields: 3,
      skip: 0,
      top: 100,
    });
  });

  it("fetches all pages with BurstAwareThrottleBucket", async () => {
    const throttleBucket = new BurstAwareThrottleBucket({
      maxTokens: 80,
      windowSeconds: 10,
    });
    const rateLimiter = new RateLimiter(throttleBucket);
    const methodMap = {
      getRecords: {
        api: {},
        method: vi.fn(),
        paramMap: ["tableId"],
        httpMethod: "GET",
      },
    } as any;

    const mockInvoke = vi
      .spyOn(invokeMethodModule, "invokeMethod")
      .mockResolvedValueOnce({
        data: Array(50).fill({ id: "record" }),
        metadata: {
          totalRecords: 100,
          numRecords: 50,
          numFields: 3,
          skip: 0,
          top: 100,
        },
      })
      .mockResolvedValueOnce({
        data: Array(50).fill({ id: "record" }),
        metadata: {
          totalRecords: 100,
          numRecords: 50,
          numFields: 3,
          skip: 50,
          top: 100,
        },
      });

    const startTime = Date.now();
    const result = await paginateRecords(
      "getRecords",
      { tableId: "mock-table" },
      methodMap,
      {},
      { getToken: vi.fn(), applyHeaders: vi.fn(), handleError: vi.fn() } as any,
      rateLimiter,
      (obj: any) => obj,
      false,
      true
    );
    const duration = Date.now() - startTime;

    expect(mockInvoke).toHaveBeenCalledTimes(2);
    expect(result.data.length).toBe(100);
    expect(result.metadata).toEqual({
      totalRecords: 100,
      numRecords: 100,
      numFields: 3,
      skip: 0,
      top: 100,
    });
    expect(duration).toBeLessThan(1000); // Mocked, no real 10s wait
  });

  it("stops when all records are fetched", async () => {
    const throttleBucket = new FlowThrottleBucket(10, 50);
    const rateLimiter = new RateLimiter(throttleBucket);
    const methodMap = {
      getRecords: {
        api: {},
        method: vi.fn(),
        paramMap: ["tableId"],
        httpMethod: "GET",
      },
    } as any;

    const mockInvoke = vi
      .spyOn(invokeMethodModule, "invokeMethod")
      .mockResolvedValueOnce({
        data: Array(10).fill({ id: "record" }),
        metadata: {
          totalRecords: 10,
          numRecords: 10,
          numFields: 3,
          skip: 0,
          top: 100,
        },
      });

    const result = await paginateRecords(
      "getRecords",
      { tableId: "mock-table" },
      methodMap,
      {},
      { getToken: vi.fn(), applyHeaders: vi.fn(), handleError: vi.fn() } as any,
      rateLimiter,
      (obj: any) => obj,
      false,
      true
    );

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(result.data.length).toBe(10);
    expect(result.metadata.totalRecords).toBe(10);
  });

  it("isPaginatable detects metadata correctly", () => {
    const validResponse = {
      data: [],
      metadata: { totalRecords: 100, numRecords: 25, numFields: 3, skip: 0 },
    };
    const invalidResponse = { data: [], other: "stuff" };

    expect(isPaginatable(validResponse)).toBe(true);
    expect(isPaginatable(invalidResponse)).toBe(false);
  });
});
