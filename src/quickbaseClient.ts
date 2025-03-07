// src/quickbaseClient.ts
import { QuickbaseClient } from "./generated-unified/QuickbaseClient.ts";
import {
  Configuration,
  HTTPHeaders,
  ResponseError,
} from "./generated/runtime.ts";
import * as apis from "./generated/apis/index.ts";
import { simplifyName } from "./utils.ts";
import fetch from "node-fetch";

export interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  debug?: boolean;
  fetchApi?: typeof fetch;
  withCredentials?: boolean;
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
  const token = config.tempToken || config.userToken || "";
  const baseUrl = `https://api.quickbase.com/v1`;

  // Define headers and remove undefined values manually
  const headers: HTTPHeaders = {};
  if (token) headers["Authorization"] = `QB-USER-TOKEN ${token}`;
  headers["QB-Realm-Hostname"] = `${config.realm}.quickbase.com`;
  headers["Content-Type"] = "application/json";

  const configuration = new Configuration({
    basePath: baseUrl,
    headers,
    fetchApi: config.fetchApi || (fetch as any),
    credentials: config.withCredentials ? "include" : "omit",
  });

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
            if (config.debug) {
              console.log(`Mapped ${rawMethodName} to ${simplifiedName}`);
            }
          }
        });
    }
    return methodMap as MethodMap;
  }

  const invokeMethod = async <K extends keyof QuickbaseClient>(
    methodName: K,
    params: Parameters<QuickbaseClient[K]>[0]
  ): Promise<ReturnType<QuickbaseClient[K]>> => {
    const methodInfo = methodMap[methodName];
    if (!methodInfo) {
      console.error(`Method ${methodName} not found in methodMap`, methodMap);
      throw new Error(`Method ${methodName} not found`);
    }
    if (config.debug) {
      console.log(`Invoking ${methodName} with params:`, params);
      console.log(`Calling method with args:`, [params, undefined]);
    }
    const args: [any, RequestInit | undefined] =
      methodInfo.paramMap.length === 1 &&
      methodInfo.paramMap[0] === "requestParameters"
        ? [params, undefined]
        : [params, undefined];

    try {
      const response = await methodInfo.method(...args);
      if (config.debug) {
        console.log(`Response from ${methodName}:`, response);
      }
      return response;
    } catch (error) {
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
          if (config.debug) {
            console.log(`Proxy called ${methodName} with:`, params);
          }
          return invokeMethod(methodName, params);
        };
      }
      console.warn(`Method ${prop} not found in methodMap`);
      return undefined;
    },
  });
}
