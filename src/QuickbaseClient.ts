import { Configuration } from "./generated/configuration.js";
import * as GeneratedApis from "./generated/api.js";
import axios, { AxiosInstance } from "axios";
import type { QuickbaseMethods } from "../types/QuickbaseClient.d.ts";

interface QuickbaseConfig {
  realm: string;
  userToken?: string;
  tempToken?: string;
  defaultDbid?: string;
}

type ApiMethod = (...args: any[]) => Promise<any>;
type MethodMap = {
  [key: string]: { api: any; method: ApiMethod; paramMap: string[] };
};

const simplifyName = (name: string): string =>
  name
    .replace(/ById$/, "")
    .replace(/Api$/, "")
    .replace(/^(\w)/, (_, c) => c.toLowerCase());

export function createQuickbaseClient(
  config: QuickbaseConfig
): QuickbaseClient {
  const token = config.tempToken || config.userToken;
  const axiosInstance = axios.create({
    baseURL: "https://api.quickbase.com/v1",
  });

  axiosInstance.defaults.headers.common["Authorization"] = token
    ? `QB-USER-TOKEN ${token}`
    : undefined;
  axiosInstance.defaults.headers.common["Content-Type"] = "application/json";
  axiosInstance.defaults.headers.common["QB-Realm-Hostname"] =
    `${config.realm}.quickbase.com`;

  const configuration = new Configuration({
    basePath: "https://api.quickbase.com/v1",
    accessToken: token,
  });

  const apis: { [key: string]: any } = {
    fields: GeneratedApis.FieldsApiFactory(
      configuration,
      undefined,
      axiosInstance
    ),
    apps: GeneratedApis.AppsApiFactory(configuration, undefined, axiosInstance),
    records: GeneratedApis.RecordsApiFactory(
      configuration,
      undefined,
      axiosInstance
    ),
    tables: GeneratedApis.TablesApiFactory(
      configuration,
      undefined,
      axiosInstance
    ),
  };

  const methodMap = buildMethodMap();

  function buildMethodMap(): MethodMap {
    const methodMap: MethodMap = {};
    for (const [apiName, api] of Object.entries(apis)) {
      const methods = Object.keys(api).filter(
        (m) => typeof api[m] === "function" && !m.startsWith("_")
      );
      for (const methodName of methods) {
        const friendlyName = simplifyName(methodName);
        const paramNames = getParamNames(api[methodName]).filter(
          (name) =>
            name !== "qBRealmHostname" &&
            name !== "authorization" &&
            name !== "options"
        );
        methodMap[friendlyName] = {
          api,
          method: api[methodName] as ApiMethod,
          paramMap: paramNames,
        };
      }
    }
    return methodMap;
  }

  function getParamNames(fn: Function): string[] {
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
    const { api, method, paramMap } = methodInfo;

    const userParams: Record<string, any> = { ...params };
    const args: any[] = [];

    const fullSignature = [
      ...paramMap.filter((p) => p !== "includeFieldPerms" && p !== "userAgent"),
      "qBRealmHostname",
      "authorization",
      ...paramMap.filter((p) => p === "includeFieldPerms" || p === "userAgent"),
      "options",
    ];

    fullSignature.forEach((param) => {
      if (param === "qBRealmHostname") {
        args.push(`${config.realm}.quickbase.com`);
      } else if (param === "authorization") {
        args.push(token ? `QB-USER-TOKEN ${token}` : undefined);
      } else if (param === "options") {
        args.push({
          headers: {
            Authorization: token ? `QB-USER-TOKEN ${token}` : undefined,
            "QB-Realm-Hostname": `${config.realm}.quickbase.com`,
            "Content-Type": "application/json",
          },
        });
      } else {
        args.push(userParams[param] ?? undefined);
      }
    });

    return method(...args).then((response) => response.data);
  }

  const client = new Proxy({} as QuickbaseClient, {
    get(_target, prop: string) {
      if (methodMap[prop]) {
        return (params: any) =>
          invokeMethod(prop as keyof QuickbaseMethods, params || {});
      }
      return undefined;
    },
  });

  return client;
}

export type QuickbaseClient = QuickbaseMethods;
