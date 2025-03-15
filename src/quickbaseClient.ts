// src/quickbaseClient.ts
import { QuickbaseClient as IQuickbaseClient } from "./generated-unified/QuickbaseClient";
import { Configuration, HTTPHeaders, ResponseError } from "./generated/runtime";
import * as apis from "./generated/apis";
import { TokenCache } from "./tokenCache";
import { simplifyName } from "./utils.ts"; // Add this import

// Re-export all model types from generated/models
export * from "./generated/models/index";

// Remove the local simplifyName function
// (The rest of the file remains unchanged)

export interface QuickbaseClient extends IQuickbaseClient {}

export interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  useTempTokens?: boolean;
  debug?: boolean;
  fetchApi?: typeof fetch;
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

type MethodMap = { [K in keyof QuickbaseClient]: MethodInfo<K> };

const getParamNames = (fn: (...args: any[]) => any): string[] =>
  fn
    .toString()
    .slice(fn.toString().indexOf("(") + 1, fn.toString().indexOf(")"))
    .split(",")
    .map((p) => p.trim().split("=")[0].trim())
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

export function quickbase(config: QuickbaseConfig): QuickbaseClient {
  const {
    realm,
    userToken,
    tempToken: initialTempToken,
    useTempTokens,
    fetchApi,
    debug,
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
    credentials: "omit", // Default to "omit" for all requests
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
        credentials: "include", // Explicitly include credentials for token fetch
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
      console.log(
        `Fetched and cached new token for dbid: ${dbid}`,
        token,
        `Expires at: ${new Date(
          Date.now() + (4 * 60 + 50) * 1000
        ).toISOString()}`
      );
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

    const requestParameters =
      methodInfo.paramMap.length === 1 &&
      methodInfo.paramMap[0] === "requestParameters"
        ? { requestParameters: params }
        : params;
    let requestOptions: RequestInit = {
      credentials: "omit", // Explicitly set to "omit" for API calls
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

    try {
      return await methodInfo.method(requestParameters, requestOptions);
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

  return proxy;
}
