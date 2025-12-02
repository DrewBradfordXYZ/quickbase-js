// tests/vitest/unit/quickbase-js/pagination.test.ts

import { describe, it, expect, vi } from "vitest";
import { paginateRecords, isPaginatable } from "@/pagination";
import { QuickbaseClient } from "@/quickbaseClient";
import * as invokeMethodModule from "@/invokeMethod";
import { GetUsers200Response, GetUsersRequest } from "@/generated/models";

// Extend GetUsersRequest to include nextPageToken
interface TestGetUsersRequest extends GetUsersRequest {
  nextPageToken?: string;
}

describe("Pagination Unit Tests", () => {
  const methodMap = {
    runQuery: {
      api: {},
      method: vi.fn(),
      paramMap: ["body"],
      httpMethod: "POST",
    },
    getUsers: {
      api: {},
      method: vi.fn(),
      paramMap: ["body"],
      httpMethod: "POST",
    },
  } as any;
  const baseHeaders = {};
  const authStrategy = {
    getToken: vi.fn(),
    applyHeaders: vi.fn(),
    handleError: vi.fn(),
  } as any;
  const rateLimiter = {
    throttle: vi.fn(),
    release: vi.fn(),
    maxRetries: 3,
  } as any;
  const transformDates = (obj: any) => obj;

  it("fetches all pages for runQuery with skip-based pagination", async () => {
    const mockInvoke = vi
      .spyOn(invokeMethodModule, "invokeMethod")
      .mockResolvedValueOnce({
        data: Array(2429).fill({ "3": { value: "record" } }),
        metadata: {
          totalRecords: 5000,
          numRecords: 2429,
          numFields: 6,
          skip: 0,
        },
      })
      .mockResolvedValueOnce({
        data: Array(2429).fill({ "3": { value: "record" } }),
        metadata: {
          totalRecords: 5000,
          numRecords: 2429,
          numFields: 6,
          skip: 2429,
        },
      })
      .mockResolvedValueOnce({
        data: Array(142).fill({ "3": { value: "record" } }),
        metadata: {
          totalRecords: 5000,
          numRecords: 142,
          numFields: 6,
          skip: 4858,
        },
      });

    const result = await paginateRecords(
      "runQuery",
      { body: { from: "mock-table", select: [3, 6] } },
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true
    );

    expect(mockInvoke).toHaveBeenCalledTimes(3);
    expect(mockInvoke).toHaveBeenNthCalledWith(
      1,
      "runQuery",
      expect.objectContaining({ body: { from: "mock-table", select: [3, 6] } }),
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true,
      false,
      0,
      4,
      false,
      null // paginationLimit
    );
    expect(mockInvoke).toHaveBeenNthCalledWith(
      2,
      "runQuery",
      expect.objectContaining({
        body: { from: "mock-table", select: [3, 6], options: { skip: 2429 } },
      }),
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true,
      false,
      0,
      4,
      true,
      null // paginationLimit
    );
    expect(mockInvoke).toHaveBeenNthCalledWith(
      3,
      "runQuery",
      expect.objectContaining({
        body: { from: "mock-table", select: [3, 6], options: { skip: 4858 } },
      }),
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true,
      false,
      0,
      4,
      true,
      null // paginationLimit
    );
    expect(result.data.length).toBe(5000);
    expect(result.metadata).toEqual({
      totalRecords: 5000,
      numRecords: 5000,
      numFields: 6,
      skip: 0,
      top: undefined,
    });
  });

  it("fetches all pages for getUsers with token-based pagination", async () => {
    const mockInvoke = vi
      .spyOn(invokeMethodModule, "invokeMethod")
      .mockImplementation(
        async <K extends keyof QuickbaseClient>(
          methodName: K,
          params: Parameters<QuickbaseClient[K]>[0] & {
            skip?: number;
            top?: number;
          },
          methodMap: any,
          baseHeaders: any,
          authStrategy: any,
          rateLimiter: any,
          transformDates: any,
          debug: boolean | undefined,
          convertDates: boolean,
          autoPaginate: boolean = true,
          attempt: number = 0,
          maxAttempts: number = rateLimiter.maxRetries + 1,
          isPaginating: boolean = false,
          paginationLimit: number | null = null // Match invokeMethod signature with default
        ): Promise<ReturnType<QuickbaseClient[K]>> => {
          if (methodName !== "getUsers")
            throw new Error("Mock only supports 'getUsers'");
          const body = (params as { body?: TestGetUsersRequest }).body;
          const token = body?.nextPageToken;
          if (!token) {
            return {
              users: Array(10).fill({ id: "user1" }),
              metadata: { nextPageToken: "token1" },
            } as GetUsers200Response as ReturnType<QuickbaseClient[K]>;
          } else if (token === "token1") {
            return {
              users: Array(5).fill({ id: "user2" }),
              metadata: { nextPageToken: "token2" },
            } as GetUsers200Response as ReturnType<QuickbaseClient[K]>;
          } else if (token === "token2") {
            return {
              users: Array(3).fill({ id: "user3" }),
              metadata: { nextPageToken: "" },
            } as GetUsers200Response as ReturnType<QuickbaseClient[K]>;
          }
          throw new Error("Unexpected token");
        }
      );

    const result = await paginateRecords(
      "getUsers",
      { body: { userIds: ["id1", "id2"] } },
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true
    );

    expect(mockInvoke).toHaveBeenCalledTimes(3);
    expect(mockInvoke).toHaveBeenNthCalledWith(
      1,
      "getUsers",
      expect.objectContaining({ body: { userIds: ["id1", "id2"] } }),
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true,
      false,
      0,
      4,
      false,
      null // paginationLimit
    );
    expect(mockInvoke).toHaveBeenNthCalledWith(
      2,
      "getUsers",
      expect.objectContaining({
        body: { userIds: ["id1", "id2"], nextPageToken: "token1" },
      }),
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true,
      false,
      0,
      4,
      true,
      null // paginationLimit
    );
    expect(mockInvoke).toHaveBeenNthCalledWith(
      3,
      "getUsers",
      expect.objectContaining({
        body: { userIds: ["id1", "id2"], nextPageToken: "token2" },
      }),
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true,
      false,
      0,
      4,
      true,
      null // paginationLimit
    );
    expect(result.users.length).toBe(18);
    expect(result.metadata).toEqual({
      numRecords: 18,
      numFields: undefined,
      nextPageToken: "",
    });
  });

  it("stops when all skip-based records are fetched in one page", async () => {
    const mockInvoke = vi
      .spyOn(invokeMethodModule, "invokeMethod")
      .mockResolvedValueOnce({
        data: Array(10).fill({ id: "record" }),
        metadata: { totalRecords: 10, numRecords: 10, numFields: 3, skip: 0 },
      });

    const result = await paginateRecords(
      "runQuery",
      { body: { from: "mock-table", select: [3] } },
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true
    );

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenNthCalledWith(
      1,
      "runQuery",
      expect.objectContaining({ body: { from: "mock-table", select: [3] } }),
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      false,
      true,
      false,
      0,
      4,
      false,
      null // paginationLimit
    );
    expect(result.data.length).toBe(10);
    expect(result.metadata.totalRecords).toBe(10);
    expect(result.metadata.numRecords).toBe(10);
  });

  it("isPaginatable detects metadata correctly", () => {
    const skipResponse = {
      data: [],
      metadata: { totalRecords: 100, numRecords: 25, numFields: 3, skip: 0 },
    };
    const tokenResponse = { users: [], metadata: { nextPageToken: "abc" } };
    const invalidResponse = { data: [], other: "stuff" };

    expect(isPaginatable(skipResponse)).toBe(true);
    expect(isPaginatable(tokenResponse)).toBe(true);
    expect(isPaginatable(invalidResponse)).toBe(false);
  });
});
