import { QuickbaseClient as IQuickbaseClient } from "./generated-unified/QuickbaseClient";
import { Configuration, HTTPHeaders } from "./generated/runtime";
import * as apis from "./generated/apis";
import { TokenCache } from "./tokenCache";
import {
  simplifyName,
  getParamNames,
  transformDates,
  extractHttpMethod,
} from "./utils";
import { invokeMethod, MethodInfo } from "./invokeMethod";
import {
  TempTokenStrategy,
  UserTokenStrategy,
  AuthorizationStrategy,
  SsoTokenStrategy,
  TicketTokenStrategy,
  CredentialProvider,
  Credentials,
} from "./authorizationStrategy";
import { FlowThrottleBucket } from "./FlowThrottleBucket";
import { BurstAwareThrottleBucket } from "./BurstAwareThrottleBucket";
import { RateLimiter } from "./rateLimiter";
import {
  TicketCache,
  InMemoryCache,
  LocalStorageTicketCache,
} from "./TicketCache";
export * from "./generated/models/index";

export interface QuickbaseClient extends IQuickbaseClient {
  withPaginationDisabled<T>(callback: () => Promise<T>): Promise<T>;
  withPaginationLimit<T>(limit: number, callback: () => Promise<T>): Promise<T>;
}

export interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  credentials?: Credentials;
  credentialProvider?: CredentialProvider;
  useTempTokens?: boolean;
  useSso?: boolean;
  useTicketAuth?: boolean;
  samlToken?: string;
  debug?: boolean;
  fetchApi?: typeof fetch;
  convertDates?: boolean;
  tempTokenLifespan?: number;
  ticketLifespanHours?: number; // Changed from ticketLifespan
  throttle?: {
    type?: "flow" | "burst-aware";
    rate?: number;
    burst?: number;
    windowSeconds?: number;
  };
  maxRetries?: number;
  retryDelay?: number;
  tokenCache?: TokenCache;
  ticketCache?: TicketCache<TicketData>;
  baseUrl?: string;
  autoPaginate?: boolean;
}

export type ThrottleOptions = {
  type?: "flow" | "burst-aware";
  rate?: number;
  burst?: number;
  windowSeconds?: number;
};

interface TicketData {
  ticket: string;
  cookies: string;
}

type MethodMap = {
  [K in keyof QuickbaseClient]: MethodInfo<K>;
};

export function quickbase(config: QuickbaseConfig): QuickbaseClient {
  const {
    realm,
    userToken,
    tempToken,
    credentials,
    credentialProvider,
    useTempTokens = false,
    useSso = false,
    useTicketAuth = false,
    samlToken,
    fetchApi,
    debug,
    convertDates = true,
    tempTokenLifespan = 290000,
    ticketLifespanHours = 12, // Default to 12 hours
    throttle = { type: "flow", rate: 5, burst: 50 },
    maxRetries = 3,
    retryDelay = 1000,
    tokenCache: providedTokenCache,
    ticketCache: providedTicketCache,
    baseUrl = "https://api.quickbase.com/v1",
    autoPaginate = true,
  } = config;

  const tokenCache = providedTokenCache || new TokenCache(tempTokenLifespan);
  const ticketCache =
    providedTicketCache ||
    (typeof window !== "undefined" && window.localStorage
      ? new LocalStorageTicketCache<TicketData>()
      : new InMemoryCache<TicketData>());

  const throttleOptions = throttle as ThrottleOptions;
  const throttleBucket =
    throttleOptions.type === "burst-aware"
      ? new BurstAwareThrottleBucket({
          maxTokens: throttleOptions.burst || 100,
          windowSeconds: throttleOptions.windowSeconds || 10,
        })
      : new FlowThrottleBucket(
          throttleOptions.rate || 5,
          throttleOptions.burst || 50
        );

  const rateLimiter = new RateLimiter(throttleBucket, maxRetries, retryDelay);

  const defaultFetch: typeof fetch =
    globalThis.fetch || globalThis.window?.fetch?.bind(globalThis.window);
  if (!defaultFetch && !fetchApi) {
    throw new Error(
      "No fetch implementation available. Please provide fetchApi in a Node.js environment without native fetch."
    );
  }
  const effectiveFetch = fetchApi || defaultFetch;

  const authStrategy: AuthorizationStrategy = useSso
    ? new SsoTokenStrategy(
        samlToken || "",
        realm,
        effectiveFetch,
        debug,
        baseUrl
      )
    : useTicketAuth
    ? new TicketTokenStrategy(
        credentials || { username: "", password: "", appToken: "" },
        credentialProvider,
        realm,
        effectiveFetch,
        tokenCache,
        ticketCache,
        debug,
        ticketLifespanHours, // Pass hours
        baseUrl
      )
    : useTempTokens
    ? new TempTokenStrategy(
        tokenCache,
        tempToken,
        effectiveFetch,
        realm,
        baseUrl
      )
    : new UserTokenStrategy(userToken || "", baseUrl);

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
            const httpMethod = extractHttpMethod(method);
            methodMap[simplifiedName] = {
              api,
              method: boundMethod as any,
              paramMap: getParamNames(method),
              httpMethod,
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

  let currentAutoPaginate = autoPaginate;
  let paginationLimit: number | null = null;

  const proxyHandler: globalThis.ProxyHandler<QuickbaseClient> = {
    get: (_: QuickbaseClient, prop: string) => {
      if (debug) {
        console.log(
          "[proxy] Accessing:",
          prop,
          "in methodMap:",
          prop in methodMap
        );
      }
      if (prop === "withPaginationDisabled") {
        return async <T>(callback: () => Promise<T>): Promise<T> => {
          const originalAutoPaginate = currentAutoPaginate;
          currentAutoPaginate = false;
          try {
            const result = await callback();
            return result;
          } finally {
            currentAutoPaginate = originalAutoPaginate;
          }
        };
      }
      if (prop === "withPaginationLimit") {
        return async <T>(
          limit: number,
          callback: () => Promise<T>
        ): Promise<T> => {
          const originalAutoPaginate = currentAutoPaginate;
          const originalLimit = paginationLimit;
          currentAutoPaginate = true;
          paginationLimit = limit;
          try {
            const result = await callback();
            return result;
          } finally {
            currentAutoPaginate = originalAutoPaginate;
            paginationLimit = originalLimit;
          }
        };
      }
      if (prop in methodMap) {
        const methodName = prop as keyof QuickbaseClient;
        return (
          params: Parameters<QuickbaseClient[typeof methodName]>[0] = {}
        ) =>
          invokeMethod(
            methodName,
            params,
            methodMap,
            baseHeaders,
            authStrategy,
            rateLimiter,
            transformDates,
            debug,
            convertDates,
            currentAutoPaginate,
            0,
            rateLimiter.maxRetries + 1,
            false,
            paginationLimit
          );
      }
      if (debug) {
        console.log("[proxy] Method not found:", prop);
      }
      return undefined;
    },
  };

  const proxy = new Proxy<QuickbaseClient>({} as QuickbaseClient, proxyHandler);

  // Prevent tree-shaking by statically referencing the methods
  proxy.withPaginationDisabled;
  proxy.withPaginationLimit;

  if (debug) {
    console.log("[createClient] Config:", config);
    console.log("[createClient] Returning proxy");
  }

  return proxy;
}
