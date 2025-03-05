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
    baseURL: "https://api.quickbase.com/v1", // Fixed API base URL
  });

  axiosInstance.defaults.headers.common["Authorization"] = token
    ? `QB-USER-TOKEN ${token}`
    : undefined;
  axiosInstance.defaults.headers.common["Content-Type"] = "application/json";
  axiosInstance.defaults.headers.common["QB-Realm-Hostname"] =
    `${config.realm}.quickbase.com`; // Full realm hostname

  console.error(
    `Initial axios headers: ${JSON.stringify(axiosInstance.defaults.headers.common)}`
  );

  const configuration = new Configuration({
    basePath: "https://api.quickbase.com/v1", // Fixed API base path
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
    const params = paramStr
      .split(",")
      .map((p) => p.trim().split("=")[0].trim())
      .filter((p) => p && !p.match(/^\{/));
    if (fn.name === "getFields") {
      return ["tableId", "includeFieldPerms"];
    }
    return params;
  }

  async function invokeMethod<K extends keyof QuickbaseMethods>(
    methodName: K,
    params: Parameters<QuickbaseMethods[K]>[0]
  ): Promise<ReturnType<QuickbaseMethods[K]>> {
    console.error(`Invoking method: ${String(methodName)}`);
    const methodInfo = methodMap[methodName];
    if (!methodInfo) throw new Error(`Method ${String(methodName)} not found`);
    const { api, method } = methodInfo;

    const getFieldsParams = params as {
      tableId: string;
      includeFieldPerms?: boolean;
    };
    const args = [
      getFieldsParams.tableId,
      `${config.realm}.quickbase.com`, // Full realm hostname
      token ? `QB-USER-TOKEN ${token}` : undefined,
      getFieldsParams.includeFieldPerms,
      undefined,
      {
        headers: {
          Authorization: token ? `QB-USER-TOKEN ${token}` : undefined,
          "QB-Realm-Hostname": `${config.realm}.quickbase.com`,
          "Content-Type": "application/json",
        },
      },
    ];

    console.error(`Args for ${String(methodName)}: ${JSON.stringify(args)}`);
    console.error(
      `Axios defaults: ${JSON.stringify(axiosInstance.defaults.headers.common)}`
    );

    let response;
    try {
      response = await method(...args);
      console.error(
        `Request headers: ${JSON.stringify(response.config.headers)}`
      );
      console.error(`Response status: ${response.status}`);
    } catch (error: any) {
      console.error(`Request failed: ${error.message}`);
      if (error.response) {
        console.error(
          `Failed request headers: ${JSON.stringify(error.response.config.headers)}`
        );
        console.error(`Failed response status: ${error.response.status}`);
      }
      throw error;
    }

    return response.data;
  }

  const client = new Proxy({} as QuickbaseClient, {
    get(_target, prop: string) {
      if (methodMap[prop]) {
        console.error(`Proxy get: ${prop}`);
        console.error(
          `Method map keys: ${JSON.stringify(Object.keys(methodMap))}`
        );
        return (params: any) =>
          invokeMethod(prop as keyof QuickbaseMethods, params);
      }
      return undefined;
    },
  });

  return client;
}

export type QuickbaseClient = QuickbaseMethods;
