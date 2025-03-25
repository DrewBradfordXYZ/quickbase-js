import { QuickbaseClient } from "./quickbaseClient";
import { invokeMethod, MethodInfo } from "./invokeMethod";
import { AuthorizationStrategy } from "./authorizationStrategy";
import { RateLimiter } from "./rateLimiter";

/**
 * Represents a paginated response from the Quick Base API.
 * @template T - The type of items in the data array.
 */
interface PaginatedResponse<T> {
  /** The key containing the array of records (e.g., "data" or "users") and additional metadata. */
  [key: string]: T[] | any;
  /** Optional array of field definitions for the records. */
  fields?: { id: number; label: string; type: string }[];
  /** Metadata describing the pagination state. */
  metadata: {
    /** Total number of records available (skip-based pagination). */
    totalRecords?: number;
    /** Number of records in the current page. */
    numRecords?: number;
    /** Number of fields in the records. */
    numFields?: number;
    /** Number of records skipped in the current page (skip-based pagination). */
    skip?: number;
    /** Maximum number of records per page (skip-based pagination). */
    top?: number;
    /** Token for the next page (token-based pagination). */
    nextPageToken?: string;
    /** Alternative token for the next page (token-based pagination). */
    nextToken?: string;
  };
}

/**
 * Represents a request body that may include pagination options.
 */
interface BodyWithOptions {
  /** Optional request body containing pagination parameters. */
  body?: {
    /** Optional pagination options for skip-based requests. */
    options?: {
      /** Sorting criteria for the records. */
      sortBy?: Array<{ fieldId: number; order: "ASC" | "DESC" }>;
      /** Number of records to skip. */
      skip?: number;
      /** Maximum number of records to return per page. */
      top?: number;
      /** Token for the next page (token-based pagination). */
      nextPageToken?: string;
      /** Alternative token for the next page (token-based pagination). */
      nextToken?: string;
      /** Additional arbitrary options. */
      [key: string]: any;
    };
    /** Token for the next page (token-based pagination, directly in body). */
    nextPageToken?: string;
    /** Alternative token for the next page (token-based pagination, directly in body). */
    nextToken?: string;
    /** Additional arbitrary body properties. */
    [key: string]: any;
  };
}

/**
 * Defines the continuation state for pagination, either skip-based or token-based.
 */
type PaginationContinuation =
  | { type: "skip"; value: number } // Skip-based: number of records to skip next
  | { type: "token"; value: string; key: "nextPageToken" | "nextToken" }; // Token-based: token for the next page

/**
 * Paginates records from a Quick Base API endpoint, handling both skip-based and token-based pagination.
 * @template K - The method name keyof QuickbaseClient.
 * @param methodName - The Quick Base API method to invoke (e.g., "runQuery", "getUsers").
 * @param params - Parameters for the API method, including optional skip and top values.
 * @param methodMap - Mapping of method names to their implementation details.
 * @param baseHeaders - Base HTTP headers for API requests.
 * @param authStrategy - Strategy for handling authentication tokens.
 * @param rateLimiter - Rate limiting mechanism to respect API limits.
 * @param transformDates - Function to transform date strings in the response.
 * @param debug - If true, logs detailed pagination information to the console.
 * @param convertDates - If true, converts date strings to Date objects in the response.
 * @param initialResponse - Optional initial response to start pagination from (used by invokeMethod).
 * @returns A promise resolving to the complete paginated response with all records.
 * @throws {Error} If no response is received during pagination.
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
  initialResponse?: PaginatedResponse<any>
): Promise<ReturnType<QuickbaseClient[K]>> {
  if (debug) console.log("[paginateRecords] Starting with params:", params);

  /** Extracts the key containing the data array from the response (e.g., "data" or "users"). */
  const getDataKey = (response: PaginatedResponse<any>): string =>
    Object.keys(response).find((key) => Array.isArray(response[key])) || "data";

  const dataKey = initialResponse ? getDataKey(initialResponse) : "data";
  let allRecords: any[] = initialResponse ? initialResponse[dataKey] : [];
  let lastResponse: PaginatedResponse<any> | undefined = initialResponse;
  let requestCount = 0;

  /**
   * Determines the pagination strategy based on response metadata.
   * @param response - The API response to analyze.
   * @returns "skip" for skip-based, "token" for token-based, or "none" if no pagination is detected.
   */
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
    return "none"; // No pagination indicators
  };

  let paginationType: "skip" | "token" | "none" = initialResponse
    ? determinePaginationType(initialResponse)
    : "none"; // Start with no pagination assumption

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
    : null; // No continuation until type is determined

  if (debug) {
    console.log("[paginateRecords] Initial state:", {
      dataKey,
      paginationType,
      continuation,
      hasInitialResponse: !!initialResponse,
      totalRecordsSoFar: allRecords.length,
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

  /** Fetches the next page of records using the provided parameters. */
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
      true
    );
    requestCount++;
    return response as PaginatedResponse<any>;
  };

  /** Constructs the parameters for the next API request based on the pagination type. */
  const getPaginatedParams = (): any => {
    const hasBody = "body" in params && params.body !== undefined;
    if (paginationType === "skip" && continuation?.type === "skip") {
      const paginatedOptions = {
        ...(hasBody && "options" in params.body! ? params.body!.options : {}),
        skip: continuation.value,
      };
      return hasBody
        ? {
            ...params,
            body: {
              ...(params as BodyWithOptions).body!,
              options: paginatedOptions,
            },
          }
        : { ...params, skip: continuation.value };
    } else if (paginationType === "token" && continuation?.type === "token") {
      if (continuation.value === "" && !lastResponse) {
        return { ...params }; // Initial call, no pagination fields
      }
      const tokenKey = continuation.key;
      return hasBody
        ? {
            ...params,
            body: {
              ...(params as BodyWithOptions).body!,
              [tokenKey]: continuation.value,
            },
          }
        : { ...params, [tokenKey]: continuation.value };
    }
    return params; // No pagination or initial call
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
    allRecords = allRecords.concat(response[actualDataKey]);
    lastResponse = response;

    if (debug && response[actualDataKey].length > 0) {
      console.log(
        "[paginateRecords] Fetched records this iteration:",
        response[actualDataKey].length,
        "IDs: first:",
        response[actualDataKey][0]["3"]?.value,
        "last:",
        response[actualDataKey][response[actualDataKey].length - 1]["3"]?.value,
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

/**
 * Checks if a response is paginatable based on its structure.
 * @param response - The response to check.
 * @returns True if the response has a data array and pagination metadata, false otherwise.
 */
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
