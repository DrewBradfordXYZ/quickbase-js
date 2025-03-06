import { Configuration, HTTPHeaders } from "./generated/runtime.ts";
import { FieldsApi } from "./generated/apis/FieldsApi.ts";
import { TablesApi } from "./generated/apis/TablesApi.ts";
import { AppsApi } from "./generated/apis/AppsApi.ts";
import { Field } from "./generated/models/Field.ts";
import { App } from "./generated/models/App.ts";
import { CreateField200Response } from "./generated/models/CreateField200Response.ts";
import { DeleteFields200Response } from "./generated/models/DeleteFields200Response.ts";
import { Upsert200Response } from "./generated/models/Upsert200Response.ts";
import { Table } from "./generated/models/Table.ts";
import fetch from "node-fetch";

interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
}

type ApiMethod<T = any> = (requestParameters: any, initOverrides?: RequestInit | ((...args: any[]) => any)) => Promise<T>;

interface MethodInfo {
  api: FieldsApi | TablesApi | AppsApi;
  method: ApiMethod;
  paramMap: string[];
}

type MethodMap = {
  [key: string]: MethodInfo;
};

interface QuickbaseMethods {
  getFields: (params: { tableId: string; includeFieldPerms?: boolean }) => Promise<Field[]>;
  getTable: (params: { appId: string; tableId: string }) => Promise<Table>;
  getApp: (params: { appId: string }) => Promise<App>;
  createField: (params: { tableId: string; generated: object }) => Promise<CreateField200Response>;
  deleteFields: (params: { tableId: string; generated: object }) => Promise<DeleteFields200Response>;
  upsert: (params: { generated: object }) => Promise<Upsert200Response>;
}

export type QuickbaseClient = QuickbaseMethods;

const simplifyName = (name: string): string =>
  name.replace(/ById$/, "").replace(/Api$/, "").replace(/^(\w)/, (_, c) => c.toLowerCase());

function getParamNames(fn: (...args: any[]) => any): string[] {
  const fnStr = fn.toString();
  const paramStr = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"));
  return paramStr
    .split(",")
    .map((p) => p.trim().split("=")[0].trim())
    .filter((p) => p && !p.match(/^\{/) && p !== "options");
}

export function createQuickbaseClient(config: QuickbaseConfig): QuickbaseClient {
  const token = config.tempToken || config.userToken || "";
  const baseUrl = `https://api.quickbase.com/v1`;
  const headers: HTTPHeaders = {
    Authorization: `QB-USER-TOKEN ${token}`,
    "QB-Realm-Hostname": `${config.realm}.quickbase.com`,
    "Content-Type": "application/json",
  };

  type FetchApi = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  const fetchApi: FetchApi =
    typeof window !== "undefined" && window.fetch
      ? window.fetch.bind(window)
      : (fetch as unknown as FetchApi);

  const configuration = new Configuration({
    basePath: baseUrl,
    headers,
    fetchApi,
  });

  const apis: Record<string, FieldsApi | TablesApi | AppsApi> = {
    fields: new FieldsApi(configuration),
    tables: new TablesApi(configuration),
    apps: new AppsApi(configuration),
  };

  const methodMap = buildMethodMap();

  function buildMethodMap(): MethodMap {
    const methodMap: MethodMap = {};
    for (const [apiName, api] of Object.entries(apis)) {
      const proto = Object.getPrototypeOf(api);
      const methods = [
        ...Object.keys(api),
        ...Object.getOwnPropertyNames(proto),
      ].filter(
        (m) => typeof api[m as keyof typeof api] === "function" && 
               !m.startsWith("_") && 
               m !== "constructor" && 
               !m.includes("Middleware") && 
               !m.includes("Pre") && 
               !m.includes("Post")
      );
      console.log(`Methods for ${apiName}:`, methods);
      for (const methodName of methods) {
        const friendlyName = simplifyName(methodName);
        const paramNames = getParamNames(api[methodName as keyof typeof api] as (...args: any[]) => any).filter(
          (name) => name !== "options"
        );
        methodMap[friendlyName] = {
          api,
          method: (api[methodName as keyof typeof api] as unknown as ApiMethod).bind(api),
          paramMap: paramNames,
        };
        console.log(`Mapped ${methodName} to ${friendlyName}`);
      }
    }
    console.log("Full methodMap:", Object.keys(methodMap));
    return methodMap;
  }

  async function invokeMethod<K extends keyof QuickbaseMethods>(
    methodName: K,
    params: Parameters<QuickbaseMethods[K]>[0]
  ): Promise<ReturnType<QuickbaseMethods[K]>> {
    const methodInfo = methodMap[methodName];
    if (!methodInfo) throw new Error(`Method ${methodName} not found`);
    const { method, paramMap } = methodInfo;

    console.log(`Calling ${methodName} with params:`, params);
    // Explicitly type args as a tuple
    const args: [any] = paramMap.length === 1 && paramMap[0] === "requestParameters" ? [params] : [params];
    console.log(`Mapped args for ${methodName}:`, args);

    const json = await method(...args);
    console.log(`Response JSON for ${methodName}:`, json);
    return json as ReturnType<QuickbaseMethods[K]>;
  }

  return new Proxy<QuickbaseClient>({} as QuickbaseClient, {
    get(_target, prop: string) {
      if (prop in methodMap) {
        return (params: Parameters<QuickbaseMethods[keyof QuickbaseMethods]>[0]) =>
          invokeMethod(prop as keyof QuickbaseMethods, params || {});
      }
      console.warn(`Method ${prop} not found in methodMap`);
      return undefined;
    },
  });
}