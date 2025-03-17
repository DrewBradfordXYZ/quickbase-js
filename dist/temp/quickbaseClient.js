import { Configuration } from "./generated/runtime";
import * as apis from "./generated/apis";
import { TokenCache } from "./tokenCache";
import { simplifyName } from "./utils";
import { invokeMethod, } from "./invokeMethod";
export * from "./generated/models/index";
const getParamNames = (fn) => fn
    .toString()
    .slice(fn.toString().indexOf("(") + 1, fn.toString().indexOf(")"))
    .split(",")
    .map((p) => p.trim().split("=")[0]?.trim())
    .filter((p) => p && !p.match(/^\{/) && p !== "options");
function transformDates(obj, convertStringsToDates = true) {
    if (obj === null || obj === undefined)
        return obj;
    if (obj instanceof Date)
        return obj;
    if (convertStringsToDates &&
        typeof obj === "string" &&
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/.test(obj)) {
        return new Date(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => transformDates(item, convertStringsToDates));
    }
    if (typeof obj === "object") {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [
            key,
            transformDates(value, convertStringsToDates),
        ]));
    }
    return obj;
}
function inferHttpMethod(methodSource, debug) {
    const methodMatch = methodSource.match(/method:\s*['"]?(\w+)['"]?/i);
    const method = methodMatch ? methodMatch[1].toUpperCase() : "GET";
    if (debug) {
        // console.log(`[inferHttpMethod] Source:`, methodSource);
        // console.log(`[inferHttpMethod] Extracted method:`, method);
    }
    return method;
}
export function quickbase(config) {
    const { realm, userToken, tempToken: initialTempToken, useTempTokens, fetchApi, debug, convertDates = true, tokenLifespan, // Added: Extracted from config
     } = config;
    const baseUrl = `https://api.quickbase.com/v1`;
    // Use tokenLifespan if provided, otherwise let TokenCache use its default (4:50)
    const tokenCache = new TokenCache(tokenLifespan);
    const baseHeaders = {
        "QB-Realm-Hostname": `${realm}.quickbase.com`,
        "Content-Type": "application/json",
    };
    if (initialTempToken) {
        baseHeaders["Authorization"] = `QB-TEMP-TOKEN ${initialTempToken}`;
    }
    else if (userToken && !useTempTokens) {
        baseHeaders["Authorization"] = `QB-USER-TOKEN ${userToken}`;
    }
    const defaultFetch = typeof globalThis.window !== "undefined"
        ? globalThis.window.fetch.bind(globalThis.window)
        : undefined;
    const configuration = new Configuration({
        basePath: baseUrl,
        headers: { ...baseHeaders },
        fetchApi: fetchApi || defaultFetch,
        credentials: "omit",
    });
    if (!configuration.fetchApi && typeof globalThis.window === "undefined") {
        throw new Error("fetchApi must be provided in non-browser environments (e.g., Node.js)");
    }
    const apiInstances = Object.fromEntries(Object.entries(apis)
        .filter(([name]) => name.endsWith("Api"))
        .map(([name, ApiClass]) => [
        name.replace("Api", "").toLowerCase(),
        new ApiClass(configuration),
    ]));
    const methodMap = buildMethodMap();
    function buildMethodMap() {
        const methodMap = {};
        const isValidMethod = (name) => !name.startsWith("_") &&
            name !== "constructor" &&
            !["Middleware", "Pre", "Post", "Raw"].some((s) => name.includes(s));
        for (const [apiName, api] of Object.entries(apiInstances)) {
            Object.getOwnPropertyNames(Object.getPrototypeOf(api))
                .filter((name) => isValidMethod(name) &&
                typeof api[name] === "function")
                .forEach((rawMethodName) => {
                const simplifiedName = simplifyName(rawMethodName);
                const rawMethodKey = `${rawMethodName}Raw`;
                const method = api[rawMethodKey] || api[rawMethodName];
                const boundMethod = method.bind(api);
                if (typeof boundMethod === "function" && boundMethod.length <= 2) {
                    const methodSource = method.toString();
                    methodMap[simplifiedName] = {
                        api,
                        method: boundMethod,
                        paramMap: getParamNames(method),
                        httpMethod: inferHttpMethod(methodSource, debug),
                    };
                }
            });
        }
        return methodMap;
    }
    const fetchTempToken = async (dbid) => {
        const effectiveFetch = fetchApi || defaultFetch;
        if (!effectiveFetch) {
            throw new Error("No fetch implementation available for fetching temp token");
        }
        const response = await effectiveFetch(`https://api.quickbase.com/v1/auth/temporary/${dbid}`, {
            method: "GET",
            headers: { ...baseHeaders },
            credentials: "include",
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API Error: ${errorBody.message || "Unknown error"} (Status: ${response.status})`);
        }
        const tokenResult = await response.json();
        const token = tokenResult.temporaryAuthorization;
        if (!token) {
            throw new Error("No temporary token returned from API");
        }
        tokenCache.set(dbid, token);
        if (debug) {
            console.log(`Fetched and cached new token for dbid: ${dbid}`, token);
        }
        return token;
    };
    const proxy = new Proxy({}, {
        get: (_, prop) => {
            if (prop in methodMap) {
                const methodName = prop;
                return (params) => invokeMethod(methodName, params, methodMap, baseHeaders, tokenCache, fetchTempToken, transformDates, initialTempToken, userToken, useTempTokens, debug, convertDates);
            }
            return undefined;
        },
    });
    if (debug) {
        // console.log("[createClient] Config:", config);
        // console.log("[createClient] Returning:", proxy);
    }
    return proxy;
}
//# sourceMappingURL=quickbaseClient.js.map