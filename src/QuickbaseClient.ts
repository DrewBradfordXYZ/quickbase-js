import { Configuration } from "./generated/configuration.js";
import * as GeneratedApis from "./generated/api.js";
import axios, { AxiosInstance } from "axios";
import type { QuickbaseMethods } from "../types/QuickbaseClient.d.ts";
import fs from "fs";

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
    baseURL: `https://${config.realm}.quickbase.com/v1`,
    headers: {
      Authorization: token ? `QB-USER-TOKEN ${token}` : undefined,
      "Content-Type": "application/json",
      "QB-Realm-Hostname": config.realm,
    },
  });

  const configuration = new Configuration({
    basePath: `https://${config.realm}.quickbase.com/v1`,
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
  fs.writeFileSync(
    "test-output.txt",
    `Method map keys: ${JSON.stringify(Object.keys(methodMap))}\n`,
    { flag: "a" }
  );

  function buildMethodMap(): MethodMap {
    const methodMap: MethodMap = {};
    for (const [apiName, api] of Object.entries(apis)) {
      const methods = Object.keys(api).filter(
        (m) => typeof api[m] === "function" && !m.startsWith("_")
      );
      for (const methodName of methods) {
        const friendlyName = simplifyName(methodName);
        const paramNames = getParamNames(api[methodName]).filter(
          (name) => name !== "qBRealmHostname" && name !== "options"
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
    params: OmitUserAgent<Parameters<QuickbaseMethods[K]>[0]>
  ): Promise<ReturnType<QuickbaseMethods[K]>> {
    fs.writeFileSync("test-output.txt", `Invoking method: ${methodName}\n`, {
      flag: "a",
    });
    const methodInfo = methodMap[methodName];
    if (!methodInfo) throw new Error(`Method ${methodName} not found`);
    const { api, method, paramMap } = methodInfo;
    const enrichedParams: Record<string, any> = {
      ...params,
      authorization: token ? `QB-USER-TOKEN ${token}` : undefined,
    };
    const args = paramMap.map((param) => enrichedParams[param] ?? undefined);
    fs.writeFileSync(
      "test-output.txt",
      `Args for ${methodName}: ${JSON.stringify(args)}\n`,
      { flag: "a" }
    );
    fs.writeFileSync(
      "test-output.txt",
      `Axios instance headers: ${JSON.stringify(axiosInstance.defaults.headers.common)}\n`,
      { flag: "a" }
    );
    const response = await method(...args, { qBRealmHostname: config.realm }); // Explicitly pass realm
    fs.writeFileSync(
      "test-output.txt",
      `Response status: ${response.status}\n`,
      { flag: "a" }
    );
    return response.data;
  }

  type OmitUserAgent<T> = T extends { userAgent?: string }
    ? Omit<T, "userAgent">
    : T;

  const client = new Proxy({} as QuickbaseClient, {
    get(_target, prop: string) {
      if (methodMap[prop]) {
        fs.writeFileSync("test-output.txt", `Proxy get: ${prop}\n`, {
          flag: "a",
        });
        return (params: any) =>
          invokeMethod(prop as keyof QuickbaseMethods, params);
      }
      return undefined;
    },
  });

  return client;
}

export type QuickbaseClient = QuickbaseMethods;
