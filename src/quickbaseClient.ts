// src/quickbaseClient.ts

import { QuickbaseClient as IQuickbaseClient } from "./generated-unified/QuickbaseClient";
import { Configuration, HTTPHeaders } from "./generated/runtime";
import * as apis from "./generated/apis";
import { TokenCache } from "./tokenCache";
import { simplifyName } from "./utils";
import { invokeMethod, MethodInfo } from "./invokeMethod";
import {
  TempTokenStrategy,
  UserTokenStrategy,
  AuthorizationStrategy,
  SsoTokenStrategy,
} from "./authorizationStrategy";
import { ThrottleBucket } from "./ThrottleBucket";
import { RateLimiter } from "./rateLimiter";

export * from "./generated/models/index";

export interface QuickbaseClient extends IQuickbaseClient {}

export interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  useTempTokens?: boolean;
  useSso?: boolean;
  samlToken?: string;
  debug?: boolean;
  fetchApi?: typeof fetch;
  convertDates?: boolean;
  tempTokenLifespan?: number;
  throttle?: { rate: number; burst: number };
  maxRetries?: number;
  retryDelay?: number;
  tokenCache?: TokenCache;
  baseUrl?: string;
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
  const methodMatches = [
    ...methodSource.matchAll(/method:\s*['"]?(\w+)['"]?/gi),
  ];
  const method =
    methodMatches.length > 0
      ? methodMatches[methodMatches.length - 1][1].toUpperCase()
      : "GET";
  if (debug) {
    console.log(`[inferHttpMethod] Source:`, methodSource);
    console.log(
      `[inferHttpMethod] All matches:`,
      methodMatches.map((m) => m[0])
    );
    console.log(`[inferHttpMethod] Extracted method:`, method);
  }
  return method;
}

export function quickbase(config: QuickbaseConfig): QuickbaseClient {
  const {
    realm,
    userToken,
    tempToken,
    useTempTokens,
    useSso,
    samlToken,
    fetchApi,
    debug,
    convertDates = true,
    tempTokenLifespan = 290000,
    throttle = { rate: 10, burst: 10 },
    maxRetries = 3,
    retryDelay = 1000,
    tokenCache: providedTokenCache,
    baseUrl = "https://api.quickbase.com/v1",
  } = config;

  const tokenCache = providedTokenCache || new TokenCache(tempTokenLifespan);
  const throttleBucket = throttle
    ? new ThrottleBucket(throttle.rate, throttle.burst)
    : null;
  const rateLimiter = new RateLimiter(throttleBucket, maxRetries, retryDelay);

  const defaultFetch: typeof fetch | undefined =
    typeof globalThis.window !== "undefined"
      ? globalThis.window.fetch.bind(globalThis.window)
      : undefined;
  const effectiveFetch = fetchApi || defaultFetch;

  if (!effectiveFetch) {
    throw new Error("No fetch implementation available");
  }

  const authStrategy: AuthorizationStrategy = useSso
    ? new SsoTokenStrategy(samlToken || "", realm, effectiveFetch, debug)
    : useTempTokens
    ? new TempTokenStrategy(tokenCache, tempToken)
    : new UserTokenStrategy(userToken || "");

  const baseHeaders: HTTPHeaders = {
    "QB-Realm-Hostname": `${realm}.quickbase.com`,
    "Content-Type": "application/json",
  };

  const configuration = new Configuration({
    basePath: baseUrl,
    headers: { ...baseHeaders },
    fetchApi: effectiveFetch,
    credentials: "omit",
  });

  // Removed redundant check:
  // if (!configuration.fetchApi && typeof globalThis.window === "undefined") {
  //   throw new Error("fetchApi must be provided in non-browser environments (e.g., Node.js)");
  // }

  const apiInstances = Object.fromEntries(
    Object.entries(apis)
      .filter(([name]) => name.endsWith("Api"))
      .map(([name, ApiClass]) => [
        name.replace("Api", "").toLowerCase(),
        new ApiClass(configuration),
      ])
  );

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
              method: boundMethod as any,
              paramMap: getParamNames(method),
              httpMethod: inferHttpMethod(methodSource, debug),
            };
          }
        });
    }
    if (debug) {
      console.log("[buildMethodMap] Methods:", Object.keys(methodMap));
    }
    return methodMap as MethodMap;
  }

  const methodMap = buildMethodMap();

  const fetchTempToken = async (dbid: string): Promise<string> => {
    const response = await effectiveFetch(`${baseUrl}/auth/temporary/${dbid}`, {
      method: "GET",
      headers: { ...baseHeaders },
      credentials: "include",
    });

    if (!response.ok) {
      const errorBody: { message?: string } = await response.json();
      throw new Error(
        `API Error: ${errorBody.message || "Unknown error"} (Status: ${
          response.status
        })`
      );
    }

    const tokenResult = await response.json();
    console.log(`[fetchTempToken] Response:`, tokenResult);
    const token = tokenResult.temporaryAuthorization;
    if (!token) {
      throw new Error("No temporary token returned from API");
    }
    tokenCache.set(dbid, token, tempTokenLifespan);
    if (debug) {
      console.log(`Fetched and cached new token for dbid: ${dbid}`, token);
    }
    return token;
  };

  const proxyHandler: ProxyHandler<QuickbaseClient> = {
    get: (_, prop: string) => {
      console.log(
        "[proxy] Accessing:",
        prop,
        "in methodMap:",
        prop in methodMap
      );
      if (prop in methodMap) {
        const methodName = prop as keyof QuickbaseClient;
        return (params: Parameters<QuickbaseClient[typeof methodName]>[0]) =>
          invokeMethod(
            methodName,
            params,
            methodMap,
            baseHeaders,
            authStrategy,
            rateLimiter,
            fetchTempToken,
            transformDates,
            debug,
            convertDates
          );
      }
      console.log("[proxy] Method not found:", prop);
      return undefined;
    },
  };

  const proxy = new Proxy<QuickbaseClient>({} as QuickbaseClient, proxyHandler);

  if (debug) {
    console.log("[createClient] Config:", config);
    console.log("[createClient] Proxy created:", proxy);
  }

  return proxy;
}
