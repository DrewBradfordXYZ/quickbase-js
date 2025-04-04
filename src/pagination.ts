// src/pagination.ts

import { QuickbaseClient } from "./quickbaseClient";
import { invokeMethod, MethodInfo } from "./invokeMethod";
import { AuthorizationStrategy } from "./authorizationStrategy";
import { RateLimiter } from "./rateLimiter";

/**
 * Represents a paginated response from the Quick Base API.
 * @template T - The type of items in the data array.
 */
interface PaginatedResponse<T> {
  [key: string]: T[] | any;
  fields?: { id: number; label: string; type: string }[];
  metadata: {
    totalRecords?: number;
    numRecords?: number;
    numFields?: number;
    skip?: number;
    top?: number;
    nextPageToken?: string;
    nextToken?: string;
  };
}

/**
 * Represents a request body that may include pagination options.
 */
interface BodyWithOptions {
  body?: {
    options?: {
      sortBy?: Array<{ fieldId: number; order: "ASC" | "DESC" }>;
      skip?: number;
      top?: number;
      nextPageToken?: string;
      nextToken?: string;
      [key: string]: any;
    };
    nextPageToken?: string;
    nextToken?: string;
    [key: string]: any;
  };
}

/**
 * Defines the continuation state for pagination, either skip-based or token-based.
 */
type PaginationContinuation =
  | { type: "skip"; value: number }
  | { type: "token"; value: string; key: "nextPageToken" | "nextToken" };

/**
 * Paginates records from a Quick Base API endpoint, handling both skip-based and token-based pagination.
 * @template K - The method name keyof QuickbaseClient.
 */
export async function paginateRecords<K extends keyof QuickbaseClient>(
  methodName: K,
  params: Parameters<QuickbaseClient[K]>[0] & { skip?: number; top?: number },
  methodMap: { [P in keyof QuickbaseClient]: MethodInfo<P> },
  baseHeaders: Record<string, string>,
  authStrategy: AuthorizationStrategy,
  rateLimiter: RateLimiter,
  transformDates: (obj: any, convertStringsToDates: boolean) => any,
  debug: boolean | undefined,
  convertDates: boolean,
  initialResponse?: PaginatedResponse<any>,
  paginationLimit: number | null = null
): Promise<ReturnType<QuickbaseClient[K]>> {
  if (debug) console.log("[paginateRecords] Starting with params:", params);

  const getDataKey = (response: PaginatedResponse<any>): string =>
    Object.keys(response).find((key) => Array.isArray(response[key])) || "data";

  const dataKey = initialResponse ? getDataKey(initialResponse) : "data";
  let allRecords: any[] = initialResponse ? initialResponse[dataKey] : [];
  let lastResponse: PaginatedResponse<any> | undefined = initialResponse;
  let requestCount = 0;

  const determinePaginationType = (
    response: PaginatedResponse<any>
  ): "skip" | "token" | "none" => {
    if (
      response.metadata.totalRecords !== undefined &&
      response.metadata.skip !== undefined
    ) {
      if (debug)
        console.log("[paginateRecords] Detected skip-based pagination");
      return "skip";
    }
    if (
      response.metadata.nextPageToken !== undefined ||
      response.metadata.nextToken !== undefined
    ) {
      if (debug)
        console.log("[paginateRecords] Detected token-based pagination");
      return "token";
    }
    if (debug)
      console.log(
        "[paginateRecords] No clear pagination type detected, assuming single-page response"
      );
    return "none";
  };

  let paginationType: "skip" | "token" | "none" = initialResponse
    ? determinePaginationType(initialResponse)
    : "none";

  let continuation: PaginationContinuation | null = initialResponse
    ? paginationType === "skip"
      ? {
          type: "skip",
          value:
            (initialResponse.metadata.skip ?? 0) +
            (initialResponse.metadata.numRecords || allRecords.length),
        }
      : paginationType === "token"
      ? {
          type: "token",
          value:
            initialResponse.metadata.nextPageToken ||
            initialResponse.metadata.nextToken ||
            "",
          key:
            initialResponse.metadata.nextPageToken !== undefined
              ? "nextPageToken"
              : "nextToken",
        }
      : null
    : null;

  if (debug) {
    console.log("[paginateRecords] Initial state:", {
      dataKey,
      paginationType,
      continuation,
      hasInitialResponse: !!initialResponse,
      totalRecordsSoFar: allRecords.length,
      paginationLimit,
    });
    if (initialResponse && initialResponse[dataKey].length > 0) {
      console.log(
        "[paginateRecords] Initial response IDs: first:",
        initialResponse[dataKey][0]["3"]?.value,
        "last:",
        initialResponse[dataKey][initialResponse[dataKey].length - 1]["3"]
          ?.value
      );
    }
  }

  const fetchNextPage = async (
    paginatedParams: any
  ): Promise<PaginatedResponse<any>> => {
    if (debug)
      console.log("[paginateRecords] Fetching with params:", paginatedParams);
    const response = await invokeMethod(
      methodName,
      paginatedParams,
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      debug,
      convertDates,
      false,
      0,
      rateLimiter.maxRetries + 1,
      true,
      paginationLimit
    );
    requestCount++;
    return response as PaginatedResponse<any>;
  };

  const getPaginatedParams = (): any => {
    const hasBody = "body" in params && params.body !== undefined;
    if (paginationType === "skip" && continuation?.type === "skip") {
      const paginatedOptions = {
        ...(hasBody && "options" in (params as BodyWithOptions).body!
          ? (params as BodyWithOptions).body!.options
          : {}),
        skip: continuation.value,
      };
      return hasBody
        ? {
            ...(params as object), // Narrow to object type
            body: {
              ...((params as BodyWithOptions).body as object), // Narrow to object
              options: paginatedOptions,
            },
          }
        : { ...(params as object), skip: continuation.value };
    } else if (paginationType === "token" && continuation?.type === "token") {
      if (continuation.value === "" && !lastResponse) {
        return { ...(params as object) }; // Initial call
      }
      const tokenKey = continuation.key;
      return hasBody
        ? {
            ...(params as object),
            body: {
              ...((params as BodyWithOptions).body as object),
              [tokenKey]: continuation.value,
            },
          }
        : { ...(params as object), [tokenKey]: continuation.value };
    }
    return { ...(params as object) };
  };

  if (!initialResponse) {
    const firstParams = getPaginatedParams();
    const firstResponse = await fetchNextPage(firstParams);
    const actualDataKey = getDataKey(firstResponse);
    allRecords = firstResponse[actualDataKey];
    lastResponse = firstResponse;
    paginationType = determinePaginationType(firstResponse);
    continuation =
      paginationType === "skip"
        ? {
            type: "skip",
            value:
              (firstResponse.metadata.skip ?? 0) +
              (firstResponse.metadata.numRecords || allRecords.length),
          }
        : paginationType === "token"
        ? {
            type: "token",
            value:
              firstResponse.metadata.nextPageToken ??
              firstResponse.metadata.nextToken ??
              "",
            key:
              firstResponse.metadata.nextPageToken !== undefined
                ? "nextPageToken"
                : "nextToken",
          }
        : null;
  }

  while (true) {
    const hasMore =
      (paginationType === "skip" &&
        continuation?.type === "skip" &&
        lastResponse!.metadata.totalRecords !== undefined &&
        continuation.value < lastResponse!.metadata.totalRecords &&
        allRecords.length < lastResponse!.metadata.totalRecords) ||
      (paginationType === "token" &&
        continuation?.type === "token" &&
        continuation.value !== "");

    if (paginationLimit !== null && allRecords.length >= paginationLimit) {
      if (debug) {
        console.log(
          "[paginateRecords] Stopping: Reached pagination limit",
          paginationLimit
        );
      }
      break;
    }

    if (!hasMore) {
      if (debug) {
        console.log(
          "[paginateRecords] Stopping:",
          paginationType === "skip"
            ? "All skip-based records fetched or no more data"
            : paginationType === "token"
            ? "Token exhausted"
            : "No pagination required"
        );
      }
      break;
    }

    const paginatedParams = getPaginatedParams();
    const response = await fetchNextPage(paginatedParams);
    const actualDataKey = getDataKey(response);

    const remainingCapacity =
      paginationLimit !== null ? paginationLimit - allRecords.length : Infinity;
    const recordsToAdd = response[actualDataKey].slice(
      0,
      Math.min(remainingCapacity, response[actualDataKey].length)
    );
    allRecords = allRecords.concat(recordsToAdd);
    lastResponse = response;

    if (debug && response[actualDataKey].length > 0) {
      console.log(
        "[paginateRecords] Fetched records this iteration:",
        recordsToAdd.length,
        "IDs: first:",
        recordsToAdd[0]["3"]?.value,
        "last:",
        recordsToAdd[recordsToAdd.length - 1]["3"]?.value,
        "Continuation after fetch:",
        continuation
      );
    }

    if (paginationType === "skip") {
      const newSkip =
        continuation?.type === "skip"
          ? continuation.value + response[actualDataKey].length
          : (response.metadata.skip ?? 0) + response[actualDataKey].length;
      continuation = { type: "skip", value: newSkip };
      if (response[actualDataKey].length === 0) {
        if (
          debug &&
          lastResponse!.metadata.totalRecords &&
          newSkip < lastResponse!.metadata.totalRecords
        ) {
          console.warn(
            "[paginateRecords] Warning: Empty response received but records remain",
            { skip: newSkip, totalRecords: lastResponse!.metadata.totalRecords }
          );
        }
        break;
      }
    } else if (paginationType === "token") {
      const newToken =
        response.metadata.nextPageToken ?? response.metadata.nextToken ?? "";
      continuation = {
        type: "token",
        value: newToken,
        key:
          response.metadata.nextPageToken !== undefined
            ? "nextPageToken"
            : "nextToken",
      };
      if (continuation.value === "") {
        break;
      } else if (response[actualDataKey].length === 0 && newToken !== "") {
        if (debug)
          console.warn(
            "[paginateRecords] Warning: Empty response with non-empty token, possible API inconsistency",
            { token: newToken }
          );
      }
    }
  }

  if (!lastResponse) {
    throw new Error("[paginateRecords] No response received during pagination");
  }

  const finalDataKey = getDataKey(lastResponse);
  const finalResponse: PaginatedResponse<any> = {
    [finalDataKey]: allRecords,
    fields: lastResponse.fields,
    metadata: {
      totalRecords:
        paginationType === "skip"
          ? lastResponse.metadata.totalRecords
          : undefined,
      numRecords: allRecords.length,
      numFields: lastResponse.metadata.numFields,
      skip: paginationType === "skip" ? 0 : undefined,
      top: paginationType === "skip" ? undefined : undefined,
      ...(paginationType === "token" &&
      continuation?.type === "token" &&
      continuation.key
        ? { [continuation.key]: "" }
        : {}),
    },
  };

  if (debug) {
    console.log("[paginateRecords] Final response summary:", {
      totalRecords: finalResponse.metadata.totalRecords,
      numRecords: finalResponse.metadata.numRecords,
      numFields: finalResponse.metadata.numFields,
      skip: finalResponse.metadata.skip,
      top: finalResponse.metadata.top,
      ...(paginationType === "token" &&
      continuation?.type === "token" &&
      continuation.key
        ? { [continuation.key]: finalResponse.metadata[continuation.key] }
        : {}),
    });
    console.log("[paginateRecords] Pagination stats:", {
      totalRequests: requestCount,
    });
  }

  return finalResponse as ReturnType<QuickbaseClient[K]>;
}

export function isPaginatable(
  response: any
): response is PaginatedResponse<any> {
  return (
    response &&
    typeof response === "object" &&
    Object.keys(response).some((key) => Array.isArray(response[key])) &&
    "metadata" in response &&
    typeof response.metadata === "object" &&
    (("totalRecords" in response.metadata &&
      "numRecords" in response.metadata &&
      "skip" in response.metadata) ||
      "nextPageToken" in response.metadata ||
      "nextToken" in response.metadata)
  );
}
