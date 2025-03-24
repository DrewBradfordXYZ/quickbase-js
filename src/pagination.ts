// src/pagination.ts
import { QuickbaseClient } from "./quickbaseClient";
import { invokeMethod, MethodInfo } from "./invokeMethod";
import { AuthorizationStrategy } from "./authorizationStrategy";
import { RateLimiter } from "./rateLimiter";

// Define the paginated response structure
interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    totalRecords: number;
    numRecords: number;
    numFields: number;
    skip: number;
    top?: number;
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
  convertDates: boolean
): Promise<ReturnType<QuickbaseClient[K]>> {
  let allRecords: any[] = [];
  let skip = params.skip || 0;
  const top = params.top || 100; // Default page size

  let lastMetadata: PaginatedResponse<any>["metadata"] | undefined; // Store last metadata for numFields

  while (true) {
    const paginatedParams = { ...params, skip, top };
    const response = await invokeMethod(
      methodName,
      paginatedParams,
      methodMap,
      baseHeaders,
      authStrategy,
      rateLimiter,
      transformDates,
      debug,
      convertDates
    );

    const typedResponse = response as PaginatedResponse<any>;
    const { data, metadata } = typedResponse;
    allRecords = allRecords.concat(data);
    lastMetadata = metadata; // Save metadata for final response

    if (debug) {
      console.log(
        `[paginateRecords] Fetched ${metadata.numRecords} records, skip: ${skip}, total: ${metadata.totalRecords}`
      );
    }

    if (metadata.numRecords + metadata.skip >= metadata.totalRecords) {
      break; // All records fetched
    }

    skip += metadata.numRecords; // Next page
  }

  return {
    data: allRecords,
    metadata: {
      totalRecords: allRecords.length,
      numRecords: allRecords.length,
      numFields: lastMetadata!.numFields, // Use last metadata
      skip: 0,
      top: allRecords.length,
    },
  } as ReturnType<QuickbaseClient[K]>;
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
