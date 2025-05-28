import { AuthorizationStrategy } from "../auth/types";
import { extractDbid } from "../auth/utils";
import { RateLimiter } from "../rate-limiting/rateLimiter";
import { RateLimitError } from "../rate-limiting/RateLimitError";
import { ResponseError } from "../generated/runtime";
import { QuickbaseClient } from "./quickbaseClient";
import { paginateRecords, isPaginatable } from "./pagination";

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

export async function invokeMethod<K extends keyof QuickbaseClient>(
  methodName: K,
  params: Parameters<QuickbaseClient[K]>[0] & {
    dbid?: string;
    tableId?: string;
    appId?: string;
    startTime?: number;
    skip?: number;
    top?: number;
  },
  methodMap: { [P in keyof QuickbaseClient]: MethodInfo<P> },
  baseHeaders: Record<string, string>,
  authStrategy: AuthorizationStrategy,
  rateLimiter: RateLimiter,
  transformDates: (obj: any, convertStringsToDates: boolean) => any,
  debug: boolean | undefined,
  convertDates: boolean,
  autoPaginate: boolean = true,
  attempt: number = 0,
  maxAttempts: number = rateLimiter.maxRetries + 1,
  isPaginating: boolean = false,
  paginationLimit: number | null = null
): Promise<ReturnType<QuickbaseClient[K]>> {
  const methodInfo = methodMap[methodName];
  if (!methodInfo) throw new Error(`Method ${methodName} not found`);

  const hasBody = "body" in params && params.body !== undefined;
  const body = hasBody ? params.body : undefined;
  const options =
    hasBody && body && typeof body === "object" && "options" in body
      ? (body as any).options
      : undefined;
  const adjustedParams = {
    ...(params as object),
    skip:
      params.skip ?? (options && "skip" in options ? options.skip : undefined),
    top: params.top ?? (options && "top" in options ? options.top : undefined),
  };

  const restParams: any = hasBody
    ? Object.fromEntries(
        Object.entries(adjustedParams).filter(
          ([key]) => key !== "body" && key !== "startTime"
        )
      )
    : { ...adjustedParams, startTime: undefined };
  const requestParameters: any = {
    ...restParams,
    ...(hasBody ? { generated: body } : {}),
  };

  const requestOptions: RequestInit = {
    credentials: methodName === "getTempTokenDBID" ? "include" : "omit",
    method: methodInfo.httpMethod,
  };

  let dbid: string | undefined = extractDbid(params);
  let token = dbid
    ? await authStrategy.getToken(dbid)
    : await authStrategy.getToken("");

  if (token) {
    authStrategy.applyHeaders(baseHeaders, token);
    requestOptions.headers = { ...baseHeaders };
    if (methodName === "getTempTokenDBID") {
      return { temporaryAuthorization: token } as ReturnType<
        QuickbaseClient[K]
      >;
    }
  }

  async function processResponse(
    rawResponse: any
  ): Promise<ReturnType<QuickbaseClient[K]>> {
    if (rawResponse instanceof Response) {
      const contentType = rawResponse.headers
        .get("Content-Type")
        ?.toLowerCase();
      if (contentType?.includes("application/json")) {
        const jsonResponse = await rawResponse.json();
        if (autoPaginate && !isPaginating && isPaginatable(jsonResponse)) {
          if (debug)
            console.log(
              "[invokeMethod] Entering pagination with params:",
              adjustedParams
            );
          return paginateRecords(
            methodName,
            adjustedParams,
            methodMap,
            baseHeaders,
            authStrategy,
            rateLimiter,
            transformDates,
            debug,
            convertDates,
            jsonResponse,
            paginationLimit
          );
        }
        return transformDates(jsonResponse, convertDates) as ReturnType<
          QuickbaseClient[K]
        >;
      }
      return rawResponse as ReturnType<QuickbaseClient[K]>;
    }
    if (rawResponse && typeof rawResponse.value === "function") {
      const response = await rawResponse.value();
      if (autoPaginate && !isPaginating && isPaginatable(response)) {
        if (debug)
          console.log(
            "[invokeMethod] Entering pagination with params:",
            adjustedParams
          );
        return paginateRecords(
          methodName,
          adjustedParams,
          methodMap,
          baseHeaders,
          authStrategy,
          rateLimiter,
          transformDates,
          debug,
          convertDates,
          response,
          paginationLimit
        );
      }
      return transformDates(response, convertDates) as ReturnType<
        QuickbaseClient[K]
      >;
    }
    return transformDates(rawResponse, convertDates) as ReturnType<
      QuickbaseClient[K]
    >;
  }

  async function parseErrorResponse(
    response: Response
  ): Promise<{ message: string; status: number }> {
    let message = "Unknown error";
    let status = response.status || 500;
    try {
      const contentType =
        response.headers?.get("Content-Type")?.toLowerCase() ||
        "application/json";
      if (
        contentType.includes("application/json") &&
        typeof response.json === "function"
      ) {
        const errorBody = await response.json();
        message = errorBody.message || "Invalid error response format";
      } else if (typeof response.text === "function") {
        message = (await response.text()) || message;
      }
    } catch (e) {
      message = "Failed to parse error response";
    }
    return { message, status };
  }

  while (attempt < maxAttempts) {
    let acquired = false;
    try {
      await rateLimiter.throttle();
      acquired = true;
      const postThrottleTime = Date.now();
      if (params.startTime !== undefined) params.startTime = postThrottleTime;
      const headers = { ...baseHeaders };
      const finalRequest = { ...requestParameters, headers };
      if (debug) console.log("[invokeMethod] Sending request:", finalRequest);
      const responsePromise = methodInfo.method(finalRequest, {
        ...requestOptions,
        headers,
      });
      rateLimiter.release();
      const response = await responsePromise;
      if (debug) console.log("[invokeMethod] Received response:", response);
      return await processResponse(response);
    } catch (error: unknown) {
      if (acquired) rateLimiter.release();
      if (debug) console.log("[invokeMethod] Caught error:", error);
      let status: number;
      let message: string;
      let response: Response | undefined;

      if (error instanceof ResponseError && error.response) {
        response = error.response;
        ({ message, status } = await parseErrorResponse(response));
      } else if (error instanceof Response) {
        response = error;
        ({ message, status } = await parseErrorResponse(response));
      } else {
        throw error;
      }

      if (status === 429) {
        if (!(error instanceof ResponseError)) {
          throw new Error("Expected ResponseError for 429 handling");
        }
        const delay = await rateLimiter.handle429(error, attempt + 1);
        if (attempt + 1 === maxAttempts) {
          throw new RateLimitError(
            `API Error: ${message} (Status: ${status})`,
            status,
            response?.headers.get("Retry-After")
              ? parseInt(response.headers.get("Retry-After")!, 10)
              : undefined
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
        continue;
      }

      let newToken: string | null;
      try {
        newToken = await authStrategy.handleError(
          status,
          params,
          attempt,
          maxAttempts,
          debug,
          methodName
        );
      } catch (authError) {
        throw authError;
      }

      if (newToken !== null) {
        token = newToken;
        authStrategy.applyHeaders(baseHeaders, token);
        requestOptions.headers = { ...baseHeaders };
        attempt++;
        continue;
      }

      throw new Error(`API Error: ${message} (Status: ${status})`);
    }
  }
  throw new Error(`API Error: Exhausted retries after ${maxAttempts} attempts`);
}
