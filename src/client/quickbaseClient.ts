import { QuickbaseClient as IQuickbaseClient } from "../generated-unified/QuickbaseClient";
import { Configuration, HTTPHeaders } from "../generated/runtime";
import * as apis from "../generated/apis";
import { TokenCache } from "../cache/TokenCache";
import {
  simplifyName,
  getParamNames,
  transformDates,
  extractHttpMethod,
} from "../utils";
import { invokeMethod, MethodInfo } from "./invokeMethod";
import {
  TempTokenStrategy,
  UserTokenStrategy,
  AuthorizationStrategy,
  SsoTokenStrategy,
  TicketTokenStrategy,
  CredentialProvider,
  Credentials,
} from "../auth";
import { FlowThrottleBucket } from "../rate-limiting/FlowThrottleBucket";
import { BurstAwareThrottleBucket } from "../rate-limiting/BurstAwareThrottleBucket";
import { RateLimiter } from "../rate-limiting/rateLimiter";
import {
  TicketCache,
  InMemoryCache,
  LocalStorageTicketCache,
} from "../cache/TicketCache";
export * from "../generated/models/index";

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
  ticketLifespanHours?: number;
  ticketRefreshThreshold?: number; // Renamed: Threshold for proactive token/ticket refresh (0 to 1)
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
    debug = false,
    convertDates = true,
    tempTokenLifespan = 290000,
    ticketLifespanHours = 12,
    ticketRefreshThreshold = 0.1, // Renamed: Default to 10% of lifespan
    throttle = { type: "flow", rate: 5, burst: 50 },
    maxRetries = 3,
    retryDelay = 1000,
    tokenCache: providedTokenCache,
    ticketCache: providedTicketCache,
    baseUrl = "https://api.quickbase.com/v1",
    autoPaginate = true,
  } = config;

  // Validate required config
  if (!realm) {
    throw new Error("QuickbaseConfig must include a valid 'realm'");
  }
  if (useTicketAuth && !credentials && !credentialProvider) {
    throw new Error(
      "Ticket authentication requires 'credentials' or 'credentialProvider'"
    );
  }
  if (useSso && !samlToken) {
    throw new Error("SSO authentication requires a 'samlToken'");
  }
  if (!useTicketAuth && !useSso && !useTempTokens && !userToken) {
    throw new Error(
      "At least one authentication method must be provided (userToken, useTempTokens, useSso, or useTicketAuth)"
    );
  }

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

  // Set up authentication strategy
  let authStrategy: AuthorizationStrategy;
  if (useSso) {
    authStrategy = new SsoTokenStrategy(
      samlToken!,
      realm,
      effectiveFetch,
      debug,
      baseUrl
    );
  } else if (useTicketAuth) {
    authStrategy = new TicketTokenStrategy(
      credentials || { username: "", password: "", appToken: "" },
      credentialProvider,
      realm,
      effectiveFetch,
      tokenCache,
      ticketCache,
      debug,
      ticketLifespanHours,
      ticketRefreshThreshold, // Renamed: Pass ticketRefreshThreshold
      baseUrl
    );
  } else if (useTempTokens) {
    authStrategy = new TempTokenStrategy(
      tokenCache,
      tempToken,
      effectiveFetch,
      realm,
      baseUrl
    );
  } else {
    authStrategy = new UserTokenStrategy(userToken || "", baseUrl);
  }

  if (debug) {
    console.log(
      "[quickbase] Selected auth strategy:",
      authStrategy.constructor.name
    );
  }

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
        console.error("[proxy] Method not found:", prop);
      }
      throw new Error(`Method '${prop}' not found in QuickbaseClient`);
    },
  };

  const proxy = new Proxy<QuickbaseClient>({} as QuickbaseClient, proxyHandler);

  // Prevent tree-shaking by statically referencing the methods
  proxy.withPaginationDisabled;
  proxy.withPaginationLimit;

  if (debug) {
    console.log("[quickbase] Config:", {
      realm,
      useSso,
      useTicketAuth,
      useTempTokens,
      hasUserToken: !!userToken,
      debug,
      tempTokenLifespan,
      ticketLifespanHours,
      ticketRefreshThreshold, // Renamed
      throttle,
      maxRetries,
      retryDelay,
      baseUrl,
      autoPaginate,
    });
    console.log("[quickbase] Returning proxy");
  }

  return proxy;
}
