// src/invokeMethod.ts
import { QuickbaseClient } from "./quickbaseClient";
import { ResponseError } from "./generated/runtime";
import { ThrottleBucket } from "./ThrottleBucket"; // Updated import
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
  methodMap: { [P in keyof QuickbaseClient]: MethodInfo<P> },
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
  throttleBucket: ThrottleBucket | null = null, // Updated type
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<ReturnType<QuickbaseClient[K]>> {
  const methodInfo = methodMap[methodName];
  if (!methodInfo) throw new Error(`Method ${methodName} not found`);

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
    ...(hasBody ? { body } : {}),
  };

  const selectedToken =
    initialTempToken || (userToken && !useTempTokens ? userToken : undefined);
  let authorizationToken = selectedToken;

  if (methodName === "getTempTokenDBID" && useTempTokens) {
    const dbid = extractDbid(params, "No dbid provided for getTempTokenDBID");
    const cachedToken = tokenCache.get(dbid);
    if (cachedToken)
      return { temporaryAuthorization: cachedToken } as ReturnType<
        QuickbaseClient[K]
      >;
  }

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
  }
  requestOptions.headers = authorizationToken
    ? {
        ...baseHeaders,
        Authorization: useTempTokens
          ? `QB-TEMP-TOKEN ${authorizationToken}`
          : `QB-USER-TOKEN ${authorizationToken}`,
      }
    : baseHeaders;

  if (debug) {
    console.log(`[${methodName}] requestParameters:`, requestParameters);
    console.log(`[${methodName}] requestOptions:`, requestOptions);
  }

  async function processResponse(
    rawResponse: any
  ): Promise<ReturnType<QuickbaseClient[K]>> {
    if (debug) console.log(`[${methodName}] rawResponse:`, rawResponse);

    if (rawResponse instanceof Response) {
      const contentType = rawResponse.headers
        .get("Content-Type")
        ?.toLowerCase();
      if (debug) console.log(`[${methodName}] contentType:`, contentType);

      if (contentType?.includes("application/octet-stream")) {
        return (await rawResponse.arrayBuffer()) as ReturnType<
          QuickbaseClient[K]
        >;
      }
      if (
        contentType?.includes("application/x-yaml") ||
        contentType?.includes("text/yaml")
      ) {
        return (await rawResponse.text()) as ReturnType<QuickbaseClient[K]>;
      }
      if (contentType?.includes("application/json")) {
        const jsonResponse = await rawResponse.json();
        return transformDates(jsonResponse, convertDates) as ReturnType<
          QuickbaseClient[K]
        >;
      }
      return rawResponse as ReturnType<QuickbaseClient[K]>;
    }

    if (rawResponse && typeof rawResponse.value === "function") {
      const response = await rawResponse.value();
      if (debug)
        console.log(`[${methodName}] Resolved JSONApiResponse:`, response);
      return transformDates(response, convertDates) as ReturnType<
        QuickbaseClient[K]
      >;
    }

    const transformed = transformDates(rawResponse, convertDates);
    if (debug)
      console.log(`[${methodName}] Transformed non-Response:`, transformed);
    return transformed as ReturnType<QuickbaseClient[K]>;
  }

  // Consolidated retry logic
  async function withRetries<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts: number;
      shouldRetry: (error: any) => boolean;
      onRetry?: (error: any, attempt: number) => Promise<void>;
      delay?: (attempt: number, error: any) => number;
    }
  ): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        if (throttleBucket) {
          if (debug) console.log(`[${methodName}] Awaiting throttle bucket`);
          await throttleBucket.acquire();
          if (debug) console.log(`[${methodName}] Throttle bucket acquired`);
        }
        return await fn();
      } catch (error) {
        attempt++;
        if (!options.shouldRetry(error) || attempt >= options.maxAttempts) {
          let errorMessage =
            error instanceof ResponseError ? error.message : String(error);
          if (error instanceof ResponseError && error.response) {
            try {
              const errorBody = await error.response.json();
              if (debug)
                console.log(
                  `Error response body for ${methodName}:`,
                  errorBody
                );
              errorMessage = errorBody?.message || errorMessage;
            } catch (e) {
              if (debug)
                console.log(`Failed to parse error body for ${methodName}:`, e);
            }
            if (error.response.status === 429) {
              throw new RateLimitError(
                `API Error: ${errorMessage} (Status: 429)`,
                429,
                undefined
              );
            }
          }
          throw new Error(
            `API Error: ${errorMessage} (Status: ${
              error instanceof ResponseError && error.response
                ? error.response.status
                : "unknown"
            })`
          );
        }

        if (options.onRetry) {
          await options.onRetry(error, attempt);
        }

        const delayMs = options.delay
          ? options.delay(attempt, error)
          : retryDelay * Math.pow(2, attempt - 1);
        if (debug) {
          console.log(
            `[${methodName}] Retrying after ${delayMs}ms (attempt ${attempt}/${
              options.maxAttempts - 1
            })`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return withRetries(
    () =>
      methodInfo
        .method(requestParameters, requestOptions)
        .then(processResponse),
    {
      maxAttempts: useTempTokens ? 2 : 1, // 1 retry for 401s if using temp tokens
      shouldRetry: (error) =>
        error instanceof ResponseError &&
        error.response?.status === 401 &&
        (useTempTokens ?? false),
      onRetry: async (error) => {
        if (error instanceof ResponseError && error.response?.status === 401) {
          if (debug)
            console.log(
              `Authorization error for ${methodName}, refreshing token:`,
              error.message
            );
          const dbid = extractDbid(
            params,
            `No dbid to refresh token after authorization error`
          );
          authorizationToken = await fetchTempToken(dbid);
          requestOptions.headers = {
            ...baseHeaders,
            Authorization: `QB-TEMP-TOKEN ${authorizationToken}`,
          };
          if (debug) console.log(`Retrying ${methodName} with new token`);
        }
      },
    }
  ).catch((error) =>
    withRetries(() => Promise.reject(error), {
      maxAttempts: maxRetries + 1, // Initial attempt + retries
      shouldRetry: (err) =>
        err instanceof ResponseError && err.response?.status === 429,
      delay: (attempt, err) => {
        const headers =
          err instanceof ResponseError && err.response
            ? err.response.headers
            : new Headers();
        const retryAfter = headers.get("Retry-After");
        return retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : retryDelay * Math.pow(2, attempt - 1);
      },
    })
  );
}

function extractDbid(
  params: Partial<TempTokenParams>,
  errorMessage: string
): string {
  const dbid = params.dbid || params.tableId || params.appId;
  if (!dbid) throw new Error(errorMessage);
  return dbid;
}
