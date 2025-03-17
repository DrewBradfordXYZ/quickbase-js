import { QuickbaseClient as IQuickbaseClient } from "./generated-unified/QuickbaseClient";
import { Configuration, HTTPHeaders } from "./generated/runtime";
import * as apis from "./generated/apis";
import { TokenCache } from "./tokenCache";
import { simplifyName } from "./utils";
import {
  invokeMethod,
  ApiMethod,
  MethodInfo,
  TempTokenParams,
} from "./invokeMethod";

export * from "./generated/models/index";

export interface QuickbaseClient extends IQuickbaseClient {}

export interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  useTempTokens?: boolean;
  debug?: boolean;
  fetchApi?: typeof fetch;
  convertDates?: boolean;
  tokenLifespan?: number; // Added: Token lifespan in milliseconds
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

function inferHttpMethod(methodSource: string, debug?: boolean): string {
  const methodMatch = methodSource.match(/method:\s*['"]?(\w+)['"]?/i);
  const method = methodMatch ? methodMatch[1].toUpperCase() : "GET";
  if (debug) {
    // console.log(`[inferHttpMethod] Source:`, methodSource);
    // console.log(`[inferHttpMethod] Extracted method:`, method);
  }
  return method;
}

export function quickbase(config: QuickbaseConfig): QuickbaseClient {
  const {
    realm,
    userToken,
    tempToken: initialTempToken,
    useTempTokens,
    fetchApi,
    debug,
    convertDates = true,
    tokenLifespan, // Added: Extracted from config
  } = config;
  const baseUrl = `https://api.quickbase.com/v1`;

  // Use tokenLifespan if provided, otherwise let TokenCache use its default (4:50)
  const tokenCache = new TokenCache(tokenLifespan);

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
          const rawMethodKey = `${rawMethodName}Raw` as keyof typeof api;
          const method =
            api[rawMethodKey] || api[rawMethodName as keyof typeof api];
          const boundMethod = method.bind(api as any) as unknown;
          if (typeof boundMethod === "function" && boundMethod.length <= 2) {
            const methodSource = method.toString();
            methodMap[simplifiedName] = {
              api,
              method: boundMethod as ApiMethod<typeof simplifiedName>,
              paramMap: getParamNames(method),
              httpMethod: inferHttpMethod(methodSource, debug),
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

  const proxy = new Proxy<QuickbaseClient>({} as QuickbaseClient, {
    get: (_, prop: string): ((params: any) => Promise<any>) | undefined => {
      if (prop in methodMap) {
        const methodName = prop as keyof QuickbaseClient;
        return (params: Parameters<QuickbaseClient[typeof methodName]>[0]) =>
          invokeMethod(
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
            convertDates
          );
      }
      return undefined;
    },
  });

  if (debug) {
    // console.log("[createClient] Config:", config);
    // console.log("[createClient] Returning:", proxy);
  }

  return proxy;
}
