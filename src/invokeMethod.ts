// src/invokeMethod.ts
import { AuthorizationStrategy, extractDbid } from "./authorizationStrategy";
import { RateLimiter } from "./rateLimiter";
import { ResponseError } from "./generated/runtime";
import { QuickbaseClient } from "./quickbaseClient";
import { GetTempTokenDBID200Response } from "./generated/models";

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
  },
  methodMap: { [P in keyof QuickbaseClient]: MethodInfo<P> },
  baseHeaders: Record<string, string>,
  authStrategy: AuthorizationStrategy,
  rateLimiter: RateLimiter,
  fetchTempToken: (dbid: string) => Promise<string>,
  transformDates: (obj: any, convertStringsToDates: boolean) => any,
  debug: boolean | undefined,
  convertDates: boolean
): Promise<ReturnType<QuickbaseClient[K]>> {
  console.log("[invokeMethod] Starting for method:", methodName);

  const methodInfo = methodMap[methodName];
  if (!methodInfo) throw new Error(`Method ${methodName} not found`);

  const hasBody = "body" in params && params.body !== undefined;
  const body = hasBody ? params.body : undefined;
  const restParams: any = hasBody
    ? Object.fromEntries(
        Object.entries(params).filter(([key]) => key !== "body")
      )
    : { ...params };
  const requestParameters: any = {
    ...restParams,
    ...(hasBody ? { generated: body } : {}),
  };

  const requestOptions: RequestInit = {
    credentials: methodName === "getTempTokenDBID" ? "include" : "omit",
    method: methodInfo.httpMethod,
  };

  let dbid: string | undefined = extractDbid(params, methodName);
  console.log("[invokeMethod] Extracted dbid:", dbid);

  let token = dbid
    ? await authStrategy.getToken(dbid)
    : await authStrategy.getToken("");
  console.log("[invokeMethod] Initial token:", token);

  if (!token && dbid) {
    token = await fetchTempToken(dbid);
    authStrategy.applyHeaders(baseHeaders, token);
    requestOptions.headers = { ...baseHeaders };
    console.log("[invokeMethod] Fetched new token:", token);
  }

  if (token) {
    authStrategy.applyHeaders(baseHeaders, token);
    requestOptions.headers = { ...baseHeaders };
    console.log(
      "[invokeMethod] Token found, headers set:",
      requestOptions.headers
    );
    if (methodName === "getTempTokenDBID") {
      console.log("[invokeMethod] Using cached token:", token);
      return { temporaryAuthorization: token } as ReturnType<
        QuickbaseClient[K]
      >;
    }
  }

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
    return transformDates(rawResponse, convertDates) as ReturnType<
      QuickbaseClient[K]
    >;
  }

  async function parseErrorResponse(
    response: any
  ): Promise<{ message: string; status: number }> {
    let message = "Unknown error";
    let status = response.status || 500;
    try {
      const contentType = response.headers?.get
        ? response.headers.get("Content-Type")?.toLowerCase()
        : "application/json";
      if (
        contentType?.includes("application/json") &&
        typeof response.json === "function"
      ) {
        const errorBody = await response.json();
        message = errorBody?.message || message;
      } else if (typeof response.text === "function") {
        message = (await response.text()) || message;
      }
    } catch (e) {
      if (debug) console.log(`[${methodName}] Error parsing response body:`, e);
    }
    console.log(
      "[invokeMethod] Parsed error - status:",
      status,
      "message:",
      message
    );
    return { message, status };
  }

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    console.log("[invokeMethod] Attempt:", attempt + 1, "of", maxAttempts);
    try {
      await rateLimiter.throttle();
      console.log("[invokeMethod] About to call API for method:", methodName);
      const response = await methodInfo.method(
        requestParameters,
        requestOptions
      );
      return await processResponse(response);
    } catch (error) {
      let status: number, message: string, response: any;

      console.log("[invokeMethod] Caught error:", error);

      if (error instanceof ResponseError && error.response) {
        response = error.response;
        ({ message, status } = await parseErrorResponse(response));
      } else if (error instanceof Response) {
        response = error;
        ({ message, status } = await parseErrorResponse(response));
      } else {
        if (debug) console.log(`[${methodName}] Unexpected error:`, error);
        throw error;
      }

      console.log("[invokeMethod] Handling error with status:", status);

      const newToken = await authStrategy.handleError(
        status,
        params,
        fetchTempToken,
        attempt,
        maxAttempts,
        debug,
        methodName
      );
      if (newToken) {
        token = newToken;
        authStrategy.applyHeaders(baseHeaders, token);
        requestOptions.headers = { ...baseHeaders };
        attempt++;
        if (debug)
          console.log(
            `[${methodName}] Retrying with token: ${token.substring(0, 10)}...`
          );
        continue;
      }
      throw new Error(`API Error: ${message} (Status: ${status})`);
    }
  }
  throw new Error(`API Error: Exhausted retries after ${maxAttempts} attempts`);
}
