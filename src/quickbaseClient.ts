// src/quickbaseClient.ts
import { QuickbaseClient } from "./generated-unified/QuickbaseClient.ts";
import {
  Configuration,
  HTTPHeaders,
  ResponseError,
} from "./generated/runtime.ts";
import * as apis from "./generated/apis/index.ts";
import { simplifyName } from "./utils.ts";
import { TokenCache } from "./tokenCache.ts";

export interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  useTempTokens?: boolean;
  debug?: boolean;
  fetchApi?: typeof fetch;
}

interface TempTokenParams {
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

export function quickbaseClient(config: QuickbaseConfig): QuickbaseClient {
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

  const headers: HTTPHeaders = {
    "QB-Realm-Hostname": `${realm}.quickbase.com`,
    "Content-Type": "application/json",
  };

  if (initialTempToken) {
    headers["Authorization"] = `QB-TEMP-TOKEN ${initialTempToken}`;
  } else if (userToken && !useTempTokens) {
    headers["Authorization"] = `QB-USER-TOKEN ${userToken}`;
  }

  const defaultFetch =
    typeof window !== "undefined" ? window.fetch.bind(window) : undefined;
  const configuration = new Configuration({
    basePath: baseUrl,
    headers: { ...headers },
    fetchApi: fetchApi || defaultFetch,
    credentials: useTempTokens ? "include" : "omit",
  });

  if (!configuration.fetchApi && typeof window === "undefined") {
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
          const boundMethod = method.bind(api) as unknown;
          if (typeof boundMethod === "function" && boundMethod.length <= 2) {
            methodMap[simplifiedName] = {
              api,
              method: boundMethod as ApiMethod<typeof simplifiedName>,
              paramMap: getParamNames(method),
            };
            if (debug)
              console.log(`Mapped ${rawMethodName} to ${simplifiedName}`);
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
        headers: { ...headers },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error: ${errorBody} (Status: ${response.status})`);
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

  const invokeMethod = async <K extends keyof QuickbaseClient>(
    methodName: K,
    params: Parameters<QuickbaseClient[K]>[0] & Partial<TempTokenParams>,
    retryCount: number = 0
  ): Promise<ReturnType<QuickbaseClient[K]>> => {
    const methodInfo = methodMap[methodName];
    if (!methodInfo) {
      console.error(`Method ${methodName} not found in methodMap`, methodMap);
      throw new Error(`Method ${methodName} not found`);
    }

    let token =
      initialTempToken || (userToken && !useTempTokens ? userToken : undefined);
    let initOverrides: RequestInit = {};

    // Early return for getTempTokenDBID if cached token exists
    if (methodName === "getTempTokenDBID" && useTempTokens) {
      const dbid = params.appId || params.tableId || params.dbid;
      if (!dbid) {
        throw new Error("No dbid provided for getTempTokenDBID");
      }
      const cachedToken = tokenCache.get(dbid);
      if (cachedToken) {
        return { temporaryAuthorization: cachedToken } as ReturnType<
          QuickbaseClient[K]
        >;
      }
    }

    if (useTempTokens && !token) {
      const dbid = params.appId || params.tableId || params.dbid;
      if (!dbid) {
        throw new Error(
          `No dbid found in params for ${methodName} to fetch temp token`
        );
      }
      if (debug)
        console.log(`Cache state before fetch for ${dbid}:`, tokenCache.dump());
      const cachedToken = tokenCache.get(dbid);
      if (cachedToken) {
        token = cachedToken;
        if (debug) console.log(`Reusing cached token for dbid: ${dbid}`, token);
      } else {
        if (typeof window === "undefined" && !fetchApi) {
          throw new Error(
            "Temporary tokens require a browser environment or a custom fetchApi with browser-like session support"
          );
        }
        token = await fetchTempToken(dbid);
        // Return immediately for getTempTokenDBID after fetching
        if (methodName === "getTempTokenDBID") {
          return { temporaryAuthorization: token } as ReturnType<
            QuickbaseClient[K]
          >;
        }
      }
      initOverrides.headers = {
        ...headers,
        Authorization: `QB-TEMP-TOKEN ${token}`,
      };
    }

    if (debug) console.log(`Invoking ${methodName} with params:`, params);
    if (debug)
      console.log(`Calling method with args:`, [params, initOverrides]);
    const args: [any, RequestInit | undefined] =
      methodInfo.paramMap.length === 1 &&
      methodInfo.paramMap[0] === "requestParameters"
        ? [params, initOverrides]
        : [params, initOverrides];

    try {
      const response = await methodInfo.method(...args);
      if (debug) console.log(`Response from ${methodName}:`, response);
      return response;
    } catch (error) {
      if (
        error instanceof ResponseError &&
        error.response.status === 401 &&
        retryCount < 1
      ) {
        if (debug)
          console.log(
            `Authorization error for ${methodName}, refreshing token:`,
            error.message
          );
        const dbid = params.appId || params.tableId || params.dbid;
        if (!dbid) {
          throw new Error(`No dbid to refresh token after authorization error`);
        }
        token = await fetchTempToken(dbid);
        initOverrides.headers = {
          ...headers,
          Authorization: `QB-TEMP-TOKEN ${token}`,
        };
        if (debug) console.log(`Retrying ${methodName} with new token`);
        return invokeMethod(methodName, params, retryCount + 1); // Retry once
      }
      if (error instanceof ResponseError) {
        let errorMessage = error.message;
        try {
          const errorBody = await error.response.json();
          console.log(`Error response body for ${methodName}:`, errorBody);
          errorMessage = errorBody.message || errorMessage;
        } catch (e) {
          console.log(
            `Failed to parse error response for ${methodName}:`,
            error.message
          );
        }
        throw new Error(
          `API Error: ${errorMessage} (Status: ${error.response.status})`
        );
      }
      throw error;
    }
  };

  return new Proxy<QuickbaseClient>({} as QuickbaseClient, {
    get: (_, prop: string): ((params: any) => Promise<any>) | undefined => {
      if (prop in methodMap) {
        const methodName = prop as keyof QuickbaseClient;
        return (params: Parameters<QuickbaseClient[typeof methodName]>[0]) => {
          if (debug) console.log(`Proxy called ${methodName} with:`, params);
          return invokeMethod(methodName, params);
        };
      }
      console.warn(`Method ${prop} not found in methodMap`);
      return undefined;
    },
  });
}
