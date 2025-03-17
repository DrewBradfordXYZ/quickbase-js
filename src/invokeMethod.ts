// src/invokeMethod.ts

import { QuickbaseClient } from "./quickbaseClient";
import { ResponseError } from "./generated/runtime";
import { TokenBucket } from "./TokenBucket";
import { RateLimitError } from "./RateLimitError";

export type ApiMethod<K extends keyof QuickbaseClient> = (
  requestParameters: Parameters<QuickbaseClient[K]>[0],
  initOverrides?: RequestInit
) => Promise<ReturnType<QuickbaseClient[K]>>;

export interface MethodInfo<K extends keyof QuickbaseClient> {
  api: any;
  method: ApiMethod<K>;
  paramMap: string[];
  httpMethod: string;
}

export interface TempTokenParams {
  appId?: string;
  tableId?: string;
  dbid?: string;
}

export interface TokenCache {
  get: (dbid: string) => string | undefined;
  set: (dbid: string, token: string) => void;
}

export async function invokeMethod<K extends keyof QuickbaseClient>(
  methodName: K,
  params: Parameters<QuickbaseClient[K]>[0] & Partial<TempTokenParams>,
  methodMap: { [K in keyof QuickbaseClient]: MethodInfo<K> },
  baseHeaders: Record<string, string>,
  tokenCache: TokenCache,
  fetchTempToken: (dbid: string) => Promise<string>,
  transformDates: (obj: any, convertStringsToDates: boolean) => any,
  initialTempToken: string | undefined,
  userToken: string | undefined,
  useTempTokens: boolean | undefined,
  debug: boolean | undefined,
  convertDates: boolean,
  retryCount: number = 0,
  throttleBucket: TokenBucket | null = null,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<ReturnType<QuickbaseClient[K]>> {
  const methodInfo = methodMap[methodName];
  if (!methodInfo) {
    throw new Error(`Method ${methodName} not found`);
  }

  const hasBody = "body" in params && params.body !== undefined;
  const body = hasBody ? (params as any).body : undefined;
  const restParams: any = hasBody
    ? Object.fromEntries(
        Object.entries(params).filter(([key]) => key !== "body")
      )
    : { ...params };

  const requestParameters: any = {
    ...restParams,
    ...(hasBody ? { generated: body } : {}),
  };

  let requestOptions: RequestInit = {
    credentials: "omit",
    method: methodInfo.httpMethod,
  };

  if (hasBody) {
    requestOptions.body = body;
  }

  const selectedToken =
    initialTempToken || (userToken && !useTempTokens ? userToken : undefined);

  if (methodName === "getTempTokenDBID" && useTempTokens) {
    const dbid = extractDbid(params, "No dbid provided for getTempTokenDBID");
    const cachedToken = tokenCache.get(dbid);
    if (cachedToken) {
      return { temporaryAuthorization: cachedToken } as ReturnType<
        QuickbaseClient[K]
      >;
    }
  }

  let authorizationToken = selectedToken;
  if (useTempTokens && !authorizationToken) {
    const dbid = extractDbid(
      params,
      `No dbid found in params for ${methodName} to fetch temp token`
    );
    const cachedToken = tokenCache.get(dbid);
    authorizationToken = cachedToken || (await fetchTempToken(dbid));
    if (methodName === "getTempTokenDBID") {
      return { temporaryAuthorization: authorizationToken } as ReturnType<
        QuickbaseClient[K]
      >;
    }
    requestOptions.headers = {
      ...baseHeaders,
      Authorization: `QB-TEMP-TOKEN ${authorizationToken}`,
    };
  } else if (authorizationToken) {
    requestOptions.headers = {
      ...baseHeaders,
      Authorization: `QB-USER-TOKEN ${authorizationToken}`,
    };
  }

  if (debug) {
    console.log(`[${methodName}] requestParameters:`, requestParameters);
    console.log(`[${methodName}] requestOptions:`, requestOptions);
  }

  async function processResponse(
    rawResponse: any
  ): Promise<ReturnType<QuickbaseClient[K]>> {
    let response: Awaited<ReturnType<QuickbaseClient[K]>>;

    if (debug) {
      console.log(`[${methodName}] rawResponse:`, rawResponse);
    }

    if (rawResponse instanceof Response) {
      const contentType = rawResponse.headers
        .get("Content-Type")
        ?.toLowerCase();
      if (debug) {
        console.log(`[${methodName}] contentType:`, contentType);
      }
      if (contentType?.includes("application/octet-stream")) {
        response = (await rawResponse.arrayBuffer()) as Awaited<
          ReturnType<QuickbaseClient[K]>
        >;
      } else if (
        contentType?.includes("application/x-yaml") ||
        contentType?.includes("text/yaml")
      ) {
        response = (await rawResponse.text()) as Awaited<
          ReturnType<QuickbaseClient[K]>
        >;
      } else if (contentType?.includes("application/json")) {
        const jsonResponse = await rawResponse.json();
        response = transformDates(jsonResponse, convertDates) as Awaited<
          ReturnType<QuickbaseClient[K]>
        >;
      } else {
        response = rawResponse as Awaited<ReturnType<QuickbaseClient[K]>>;
      }
    } else if (rawResponse && typeof rawResponse.value === "function") {
      response = await rawResponse.value();
      if (debug) {
        console.log(`[${methodName}] Resolved JSONApiResponse:`, response);
      }
      response = transformDates(response, convertDates) as Awaited<
        ReturnType<QuickbaseClient[K]>
      >;
    } else {
      response = transformDates(rawResponse, convertDates) as Awaited<
        ReturnType<QuickbaseClient[K]>
      >;
      if (debug) {
        console.log(`[${methodName}] Transformed non-Response:`, response);
      }
    }

    return response;
  }

  async function handleError(
    error: any,
    retryCount: number
  ): Promise<ReturnType<QuickbaseClient[K]>> {
    if (!(error instanceof ResponseError)) {
      throw error; // Non-ResponseError cases
    }

    const status = error.response.status;
    const headers = error.response.headers;
    const retryAfterHeader = headers.get("Retry-After");
    const retryAfter = retryAfterHeader
      ? parseInt(retryAfterHeader, 10) * 1000
      : undefined;
    let errorMessage = error.message;

    let errorBody: { message?: string } | null = null;
    try {
      errorBody = await error.response.json();
      if (debug) {
        console.log(`Error response body for ${methodName}:`, errorBody);
      }
      errorMessage = errorBody?.message || errorMessage;
    } catch (e) {
      if (debug) {
        console.log(`Failed to parse error body for ${methodName}:`, e);
      }
    }

    if (status === 429 && retryCount < maxRetries) {
      const delayMs = retryAfter || retryDelay * Math.pow(2, retryCount);
      if (debug) {
        console.log(
          `[${methodName}] Rate limit exceeded (429), retrying after ${delayMs}ms (attempt ${
            retryCount + 1
          }/${maxRetries})`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      if (throttleBucket) {
        if (debug) console.log(`[${methodName}] Awaiting throttle bucket`);
        await throttleBucket.acquire();
        if (debug) console.log(`[${methodName}] Throttle bucket acquired`);
      }

      // Recursively call invokeMethod with incremented retryCount
      return await invokeMethod(
        methodName,
        params,
        methodMap,
        baseHeaders,
        tokenCache,
        fetchTempToken,
        transformDates,
        initialTempToken,
        userToken,
        useTempTokens,
        debug,
        convertDates,
        retryCount + 1, // Increment retryCount
        throttleBucket,
        maxRetries,
        retryDelay
      );
    }

    if (status === 429) {
      throw new RateLimitError(
        `API Error: ${errorMessage} (Status: ${status})`,
        status,
        retryAfter ? retryAfter / 1000 : undefined
      );
    }

    if (status === 401 && retryCount < 1 && useTempTokens) {
      if (debug) {
        console.log(
          `Authorization error for ${methodName}, refreshing token:`,
          error.message
        );
      }
      const dbid = extractDbid(
        params,
        `No dbid to refresh token after authorization error`
      );
      authorizationToken = await fetchTempToken(dbid);
      requestOptions.headers = {
        ...baseHeaders,
        Authorization: `QB-TEMP-TOKEN ${authorizationToken}`,
      };
      if (debug) {
        console.log(`Retrying ${methodName} with new token`);
      }

      if (throttleBucket) {
        if (debug) console.log(`[${methodName}] Awaiting throttle bucket`);
        await throttleBucket.acquire();
        if (debug) console.log(`[${methodName}] Throttle bucket acquired`);
      }

      const rawResponse = await methodInfo.method(
        requestParameters,
        requestOptions
      );
      return await processResponse(rawResponse);
    }

    throw new Error(`API Error: ${errorMessage} (Status: ${status})`);
  }

  try {
    if (throttleBucket) {
      if (debug) console.log(`[${methodName}] Awaiting throttle bucket`);
      await throttleBucket.acquire();
      if (debug) console.log(`[${methodName}] Throttle bucket acquired`);
    }

    const rawResponse: any = await methodInfo.method(
      requestParameters,
      requestOptions
    );
    return await processResponse(rawResponse);
  } catch (error) {
    return await handleError(error, retryCount);
  }
}

function extractDbid(
  params: Partial<TempTokenParams>,
  errorMessage: string
): string {
  const dbid = params.dbid || params.tableId || params.appId;
  if (!dbid) {
    throw new Error(errorMessage);
  }
  return dbid;
}
