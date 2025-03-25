import { QuickbaseClient } from "./quickbaseClient";
import { invokeMethod, MethodInfo } from "./invokeMethod";
import { AuthorizationStrategy } from "./authorizationStrategy";
import { RateLimiter } from "./rateLimiter";

interface PaginatedResponse<T> {
  data: T[];
  fields?: { id: number; label: string; type: string }[];
  metadata: {
    totalRecords: number;
    numRecords: number;
    numFields: number;
    skip: number;
    top?: number;
  };
}

interface BodyWithOptions {
  body?: {
    options?: {
      sortBy?: Array<{ fieldId: number; order: "ASC" | "DESC" }>;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

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

  let allRecords: any[] = initialResponse ? initialResponse.data : [];
  let skip = initialResponse
    ? initialResponse.metadata.skip + initialResponse.metadata.numRecords
    : params.skip || 0;
  let lastResponse: PaginatedResponse<any> | undefined = initialResponse;
  let requestCount = 0;

  if (debug) {
    console.log("[paginateRecords] Initial state:", {
      skip,
      hasInitialResponse: !!initialResponse,
      totalRecordsSoFar: allRecords.length,
    });
    if (initialResponse && initialResponse.data.length > 0) {
      console.log(
        "[paginateRecords] Initial response IDs: first:",
        initialResponse.data[0]["3"]?.value,
        "last:",
        initialResponse.data[initialResponse.data.length - 1]["3"]?.value
      );
    }
  }

  if (!initialResponse) {
    const firstParams = { ...params, skip };
    if (debug)
      console.log("[paginateRecords] First call with params:", firstParams);
    const firstResponse = await invokeMethod(
      methodName,
      firstParams,
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      debug,
      convertDates,
      false
    );
    requestCount++;
    const typedFirstResponse = firstResponse as PaginatedResponse<any>;
    allRecords = typedFirstResponse.data;
    lastResponse = typedFirstResponse;
    skip += typedFirstResponse.data.length;
  }

  while (
    skip < lastResponse!.metadata.totalRecords &&
    allRecords.length < lastResponse!.metadata.totalRecords
  ) {
    const hasBody = "body" in params && params.body !== undefined;
    const paginatedOptions = {
      ...(hasBody && "options" in params.body! ? params.body!.options : {}),
      skip,
      // No top—rely on Quickbase’s default limit
    };
    const paginatedParams = hasBody
      ? {
          ...params,
          body: {
            ...(params as BodyWithOptions).body!,
            options: paginatedOptions,
          },
        }
      : { ...params, skip };

    if (debug)
      console.log("[paginateRecords] Paginating with params:", paginatedParams);
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
    const typedResponse = response as PaginatedResponse<any>;
    allRecords = allRecords.concat(typedResponse.data);
    lastResponse = typedResponse;

    if (debug && typedResponse.data.length > 0) {
      console.log(
        "[paginateRecords] Fetched records this iteration:",
        typedResponse.data.length,
        "IDs: first:",
        typedResponse.data[0]["3"]?.value,
        "last:",
        typedResponse.data[typedResponse.data.length - 1]["3"]?.value
      );
    }

    skip += typedResponse.data.length;

    if (typedResponse.data.length === 0) {
      if (debug)
        console.log("[paginateRecords] Stopping: no more data returned");
      break;
    }
  }

  const finalResponse = {
    data: allRecords, // No cap
    fields: lastResponse!.fields,
    metadata: {
      totalRecords: lastResponse!.metadata.totalRecords,
      numRecords: allRecords.length, // Reflect actual fetched count
      numFields: lastResponse!.metadata.numFields,
      skip: 0,
      top: undefined,
    },
  };
  if (debug) {
    console.log("[paginateRecords] Final response summary:", {
      totalRecords: finalResponse.metadata.totalRecords,
      numRecords: finalResponse.metadata.numRecords,
      numFields: finalResponse.metadata.numFields,
      skip: finalResponse.metadata.skip,
      top: finalResponse.metadata.top,
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
    "data" in response &&
    "metadata" in response &&
    typeof response.metadata === "object" &&
    "totalRecords" in response.metadata &&
    "numRecords" in response.metadata &&
    "skip" in response.metadata
  );
}
