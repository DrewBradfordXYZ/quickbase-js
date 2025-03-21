// src/utils.ts

export function simplifyName(methodName: string): string {
  // Assuming this removes 'Raw' or similar suffixes as per your original logic
  return methodName
    .replace(/Raw$/, "")
    .replace(/^./, (str) => str.toLowerCase());
}

export function getParamNames(func: Function): string[] {
  // Your existing logic to extract parameter names from a function
  const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
  const ARGUMENT_NAMES = /([^\s,]+)/g;
  const fnStr = func.toString().replace(STRIP_COMMENTS, "");
  const result = fnStr
    .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
    .match(ARGUMENT_NAMES);
  return result || [];
}

export function transformDates(obj: any, convertStringsToDates: boolean): any {
  // Your existing logic to transform dates
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj))
    return obj.map((item) => transformDates(item, convertStringsToDates));
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      typeof value === "string" &&
      convertStringsToDates &&
      /^\d{4}-\d{2}-\d{2}/.test(value)
    ) {
      result[key] = new Date(value);
    } else if (value instanceof Date) {
      result[key] = value;
    } else if (typeof value === "object") {
      result[key] = transformDates(value, convertStringsToDates);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function extractHttpMethod(method: Function): string {
  const source = method.toString();
  // Match the `method: 'SOME_METHOD'` part of the `request` call
  const match = source.match(/method:\s*['"](\w+)['"]/i);
  return match ? match[1].toUpperCase() : "GET"; // Fallback to GET if no match
}
