import { QuickbaseClient } from "./generated-unified/QuickbaseClient.ts";
import { Configuration, HTTPHeaders } from "./generated/runtime.ts";
import * as apis from "./generated/apis/index.ts";
import fetch from "node-fetch";
import { simplifyName } from "./utils.ts";

interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  debug?: boolean;
}

type ApiMethod = (
  requestParameters: any,
  initOverrides?: RequestInit
) => Promise<any>;
interface MethodInfo {
  api: any;
  method: ApiMethod;
  paramMap: string[];
}
type MethodMap = { [key: string]: MethodInfo };

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
  const headers: HTTPHeaders = {
    Authorization: `QB-USER-TOKEN ${token}`,
    "QB-Realm-Hostname": `${config.realm}.quickbase.com`,
    "Content-Type": "application/json",
  };
  const fetchApi =
    typeof window !== "undefined" ? window.fetch.bind(window) : (fetch as any);
  const configuration = new Configuration({
    basePath: baseUrl,
    headers,
    fetchApi,
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
    const methodMap: MethodMap = {};
    const isValidMethod = (name: string) =>
      !name.startsWith("_") &&
      name !== "constructor" &&
      !["Middleware", "Pre", "Post"].some((s) => name.includes(s));

    for (const [apiName, api] of Object.entries(apiInstances)) {
      Object.getOwnPropertyNames(Object.getPrototypeOf(api))
        .filter(
          (name) =>
            isValidMethod(name) &&
            typeof api[name as keyof typeof api] === "function"
        )
        .forEach((methodName) => {
          const friendlyName = simplifyName(methodName);
          const originalMethod = api[methodName as keyof typeof api];
          const boundMethod = originalMethod.bind(api) as unknown as ApiMethod;
          methodMap[friendlyName] = {
            api,
            method: boundMethod,
            paramMap: getParamNames(originalMethod),
          };
        });
    }
    return methodMap;
  }

  const invokeMethod = <K extends keyof QuickbaseClient>(
    methodName: K,
    params: Parameters<QuickbaseClient[K]>[0]
  ): Promise<ReturnType<QuickbaseClient[K]>> => {
    const methodInfo = methodMap[methodName as string];
    if (!methodInfo) throw new Error(`Method ${methodName} not found`);
    const args: [any, RequestInit | undefined] =
      methodInfo.paramMap.length === 1 &&
      methodInfo.paramMap[0] === "requestParameters"
        ? [params, undefined]
        : [params, undefined];
    return methodInfo.method(...args) as ReturnType<QuickbaseClient[K]>;
  };

  return new Proxy<QuickbaseClient>({} as QuickbaseClient, {
    get: (_, prop: string) =>
      prop in methodMap
        ? (params: any) =>
            invokeMethod(prop as keyof QuickbaseClient, params || {})
        : (console.warn(`Method ${prop} not found in methodMap`), undefined),
  });
}
