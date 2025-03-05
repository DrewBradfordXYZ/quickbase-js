import { Configuration, HTTPHeaders } from "./generated/runtime";
import { FieldsApi } from "./generated/apis/FieldsApi";
import { TablesApi } from "./generated/apis/TablesApi";
import { AppsApi } from "./generated/apis/AppsApi";
import { Field } from "./generated/models/Field";
import { App } from "./generated/models/App"; // Use App instead of GetApp200Response
import { CreateField200Response } from "./generated/models/CreateField200Response";
import { DeleteFields200Response } from "./generated/models/DeleteFields200Response";
import { Upsert200Response } from "./generated/models/Upsert200Response";
import { Table } from "./generated/models/Table";

export interface QuickbaseMethods {
  getFields(params: {
    tableId: string;
    includeFieldPerms?: boolean;
  }): Promise<Field[]>;
  getTable(params: { appId: string; tableId: string }): Promise<Table>;
  getApp(params: { appId: string }): Promise<App>;
  createField(params: {
    tableId: string;
    generated: any;
  }): Promise<CreateField200Response>;
  deleteFields(params: {
    tableId: string;
    generated: any;
  }): Promise<DeleteFields200Response>;
  upsert(params: { generated: any }): Promise<Upsert200Response>;
}

interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  defaultDbid?: string;
}

type ApiMethod = (...args: unknown[]) => Promise<unknown>;
type MethodMap = Record<
  string,
  {
    api: FieldsApi | TablesApi | AppsApi;
    method: ApiMethod;
    paramMap: string[];
  }
>;

const simplifyName = (name: string): string =>
  name
    .replace(/ById$/, "")
    .replace(/Api$/, "")
    .replace(/^(\w)/, (_, c) => c.toLowerCase());

export function createQuickbaseClient(
  config: QuickbaseConfig
): QuickbaseClient {
  const token = config.tempToken || config.userToken || ""; // Default to empty string
  const baseUrl = `https://api.quickbase.com/v1`;
  const headers: HTTPHeaders = {
    Authorization: `QB-USER-TOKEN ${token}`,
    "QB-Realm-Hostname": `${config.realm}.quickbase.com`,
    "Content-Type": "application/json",
  };

  const configuration = new Configuration({
    basePath: baseUrl,
    headers,
    fetchApi: typeof window !== "undefined" ? window.fetch.bind(window) : fetch,
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
      const methods = Object.keys(api).filter(
        (m) =>
          typeof api[m as keyof typeof api] === "function" && !m.startsWith("_")
      );
      for (const methodName of methods) {
        const friendlyName = simplifyName(methodName);
        const paramNames = getParamNames(
          api[methodName as keyof typeof api] as ApiMethod
        ).filter((name) => name !== "options");
        methodMap[friendlyName] = {
          api,
          method: api[methodName as keyof typeof api] as ApiMethod,
          paramMap: paramNames,
        };
      }
    }
    return methodMap;
  }

  function getParamNames(fn: ApiMethod): string[] {
    const fnStr = fn.toString();
    const paramStr = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"));
    return paramStr
      .split(",")
      .map((p) => p.trim().split("=")[0].trim())
      .filter((p) => p && !p.match(/^\{/));
  }

  async function invokeMethod<K extends keyof QuickbaseMethods>(
    methodName: K,
    params: Parameters<QuickbaseMethods[K]>[0]
  ): Promise<ReturnType<QuickbaseMethods[K]>> {
    const methodInfo = methodMap[methodName];
    if (!methodInfo) throw new Error(`Method ${methodName} not found`);
    const { method, paramMap } = methodInfo;

    const userParams: Record<string, unknown> = { ...params };
    const args: unknown[] = [];
    paramMap.forEach((param) => {
      args.push(userParams[param] ?? undefined);
    });

    const response = await (method(...args) as Promise<Response>);
    return response.json() as Promise<ReturnType<QuickbaseMethods[K]>>;
  }

  return new Proxy<QuickbaseClient>({} as QuickbaseClient, {
    get(_target, prop: string) {
      if (prop in methodMap) {
        return (
          params: Parameters<QuickbaseMethods[keyof QuickbaseMethods]>[0]
        ) => invokeMethod(prop as keyof QuickbaseMethods, params || {});
      }
      return undefined;
    },
  });
}

export type QuickbaseClient = QuickbaseMethods;
