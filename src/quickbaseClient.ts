// src/quickbaseClient.ts
import { QuickbaseClient as IQuickbaseClient } from "./generated-unified/QuickbaseClient";
import { Configuration, HTTPHeaders, ResponseError } from "./generated/runtime";
import * as apis from "./generated/apis";
import { TokenCache } from "./tokenCache";
import { simplifyName } from "./utils";

export * from "./generated/models/index";

export interface QuickbaseClient extends IQuickbaseClient {}

export interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  useTempTokens?: boolean;
  debug?: boolean;
  fetchApi?: typeof fetch;
  convertDates?: boolean; // New flag to control date string conversion, defaults to true
}

export interface TempTokenParams {
  appId?: string;
  tableId?: string;
  dbid?: string;
}

type ApiMethod<K extends keyof QuickbaseClient> = (
  requestParameters: Parameters<QuickbaseClient[K]>[0],
  initOverrides?: RequestInit
) => Promise<ReturnType<QuickbaseClient[K]>>;

interface MethodInfo<K extends keyof QuickbaseClient> {
  api: any;
  method: ApiMethod<K>;
  paramMap: string[];
}

type MethodMap = {
  [K in keyof QuickbaseClient]: MethodInfo<K>;
};

const getParamNames = (fn: (...args: any[]) => any): string[] =>
  fn
    .toString()
    .slice(fn.toString().indexOf("(") + 1, fn.toString().indexOf(")"))
    .split(",")
    .map((p) => p.trim().split("=")[0]?.trim())
    .filter((p) => p && !p.match(/^\{/) && p !== "options");

const extractDbid = (
  params: Partial<TempTokenParams>,
  errorMessage: string
): string => {
  const dbid = params.dbid || params.tableId || params.appId;
  if (!dbid) {
    throw new Error(errorMessage);
  }
  return dbid;
};

// Utility to convert ISO date strings to Date objects recursively, with optional conversion
function transformDates(obj: any, convertStringsToDates: boolean = true): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (
    convertStringsToDates &&
    typeof obj === "string" &&
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/.test(
      obj
    )
  ) {
    return new Date(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => transformDates(item, convertStringsToDates));
  }
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        transformDates(value, convertStringsToDates),
      ])
    );
  }
  return obj;
}

export function quickbase(config: QuickbaseConfig): QuickbaseClient {
  const {
    realm,
    userToken,
    tempToken: initialTempToken,
    useTempTokens,
    fetchApi,
    debug,
    convertDates = true, // Default to true for backward compatibility
  } = config;
  const baseUrl = `https://api.quickbase.com/v1`;

  const tokenCache = new TokenCache();

  const baseHeaders: HTTPHeaders = {
    "QB-Realm-Hostname": `${realm}.quickbase.com`,
    "Content-Type": "application/json",
  };

  if (initialTempToken) {
    baseHeaders["Authorization"] = `QB-TEMP-TOKEN ${initialTempToken}`;
  } else if (userToken && !useTempTokens) {
    baseHeaders["Authorization"] = `QB-USER-TOKEN ${userToken}`;
  }

  const defaultFetch: typeof fetch | undefined =
    typeof globalThis.window !== "undefined"
      ? globalThis.window.fetch.bind(globalThis.window)
      : undefined;
  const configuration = new Configuration({
    basePath: baseUrl,
    headers: { ...baseHeaders },
    fetchApi: fetchApi || defaultFetch,
    credentials: "omit",
  });

  if (!configuration.fetchApi && typeof globalThis.window === "undefined") {
    throw new Error(
      "fetchApi must be provided in non-browser environments (e.g., Node.js)"
    );
  }

  const apiInstances = Object.fromEntries(
    Object.entries(apis)
      .filter(([name]) => name.endsWith("Api"))
      .map(([name, ApiClass]) => [
        name.replace("Api", "").toLowerCase(),
        new ApiClass(configuration),
      ])
  );

  const methodMap = buildMethodMap();

  function buildMethodMap(): MethodMap {
    const methodMap: Partial<MethodMap> = {};
    const isValidMethod = (name: string) =>
      !name.startsWith("_") &&
      name !== "constructor" &&
      !["Middleware", "Pre", "Post", "Raw"].some((s) => name.includes(s));

    for (const [apiName, api] of Object.entries(apiInstances)) {
      Object.getOwnPropertyNames(Object.getPrototypeOf(api))
        .filter(
          (name) =>
            isValidMethod(name) &&
            typeof api[name as keyof typeof api] === "function"
        )
        .forEach((rawMethodName) => {
          const simplifiedName = simplifyName(
            rawMethodName
          ) as keyof QuickbaseClient;
          const method = api[rawMethodName as keyof typeof api];
          const boundMethod = method.bind(api as any) as unknown;
          if (typeof boundMethod === "function" && boundMethod.length <= 2) {
            methodMap[simplifiedName] = {
              api,
              method: boundMethod as ApiMethod<typeof simplifiedName>,
              paramMap: getParamNames(method),
            };
          }
        });
    }
    return methodMap as MethodMap;
  }

  const fetchTempToken = async (dbid: string): Promise<string> => {
    const effectiveFetch = fetchApi || defaultFetch;
    if (!effectiveFetch) {
      throw new Error(
        "No fetch implementation available for fetching temp token"
      );
    }

    const response = await effectiveFetch(
      `https://api.quickbase.com/v1/auth/temporary/${dbid}`,
      {
        method: "GET",
        headers: { ...baseHeaders },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorBody: { message?: string } = await response.json();
      throw new Error(
        `API Error: ${errorBody.message || "Unknown error"} (Status: ${
          response.status
        })`
      );
    }

    const tokenResult = await response.json();
    const token = tokenResult.temporaryAuthorization;
    if (!token) {
      throw new Error("No temporary token returned from API");
    }
    tokenCache.set(dbid, token);
    if (debug) {
      console.log(`Fetched and cached new token for dbid: ${dbid}`, token);
    }
    return token;
  };

  async function invokeMethod<K extends keyof QuickbaseClient>(
    methodName: K,
    params: Parameters<QuickbaseClient[K]>[0] & Partial<TempTokenParams>,
    retryCount: number = 0
  ): Promise<ReturnType<QuickbaseClient[K]>> {
    const methodInfo = methodMap[methodName];
    if (!methodInfo) {
      throw new Error(`Method ${methodName} not found`);
    }

    // Safely handle body extraction
    const hasBody = "body" in params && params.body !== undefined;
    const body = hasBody ? (params as any).body : undefined;
    const restParams: any = hasBody
      ? Object.fromEntries(
          Object.entries(params).filter(([key]) => key !== "body")
        )
      : { ...params };

    // Construct requestParameters with 'generated' for body
    const requestParameters: any = {
      ...restParams,
      ...(body ? { generated: { ...body } } : {}),
    };

    let requestOptions: RequestInit = {
      credentials: "omit",
    };

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

    try {
      const response = await methodInfo.method(
        requestParameters,
        requestOptions
      );
      if (debug) {
        console.log(`[${methodName}] rawResponse:`, response);
      }
      if (response instanceof Response) {
        const contentType = response.headers.get("Content-Type")?.toLowerCase();
        if (debug) {
          console.log(`[${methodName}] contentType:`, contentType);
        }
        if (contentType?.includes("application/octet-stream")) {
          return (await response.arrayBuffer()) as ReturnType<
            QuickbaseClient[K]
          >;
        } else if (
          contentType?.includes("application/x-yaml") ||
          contentType?.includes("text/yaml")
        ) {
          return (await response.text()) as ReturnType<QuickbaseClient[K]>;
        } else if (contentType?.includes("application/json")) {
          const jsonResponse = await response.json();
          if (debug) {
            console.log(`[${methodName}] jsonResponse:`, jsonResponse);
          }
          const transformedResponse = transformDates(
            jsonResponse,
            convertDates
          );
          if (debug) {
            console.log(
              `[${methodName}] transformedResponse:`,
              transformedResponse
            );
          }
          return transformedResponse as ReturnType<QuickbaseClient[K]>;
        }
        return response as ReturnType<QuickbaseClient[K]>;
      } else {
        if (debug) {
          console.log(
            `[${methodName}] non-Response return, applying transform:`,
            response
          );
        }
        const transformedResponse = transformDates(response, convertDates);
        if (debug) {
          console.log(
            `[${methodName}] transformedNonResponse:`,
            transformedResponse
          );
        }
        return transformedResponse as ReturnType<QuickbaseClient[K]>;
      }
    } catch (error) {
      if (
        error instanceof ResponseError &&
        error.response.status === 401 &&
        retryCount < 1 &&
        useTempTokens
      ) {
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
        return invokeMethod(methodName, params, retryCount + 1);
      }
      if (error instanceof ResponseError) {
        let errorMessage = error.message;
        try {
          const errorBody: { message?: string } = await error.response.json();
          if (debug) {
            console.log(`Error response body for ${methodName}:`, errorBody);
          }
          errorMessage = errorBody.message || errorMessage;
        } catch (e) {
          // Silent fail on parse error
        }
        throw new Error(
          `API Error: ${errorMessage} (Status: ${error.response.status})`
        );
      }
      throw error;
    }
  }

  const proxy = new Proxy<QuickbaseClient>({} as QuickbaseClient, {
    get: (_, prop: string): ((params: any) => Promise<any>) | undefined => {
      if (prop in methodMap) {
        const methodName = prop as keyof QuickbaseClient;
        return (params: Parameters<QuickbaseClient[typeof methodName]>[0]) =>
          invokeMethod(methodName, params);
      }
      return undefined;
    },
  });

  if (debug) {
    console.log("[createClient] Config:", config);
    console.log("[createClient] Returning:", proxy);
  }

  return proxy;
}
