export function simplifyName(name: string): string {
  return name
    .replace(/ById$/, "")
    .replace(/Api$/, "")
    .replace(/^(\w)/, (_, c) => c.toLowerCase());
}

export function getParamNames(fn: (...args: any[]) => any): string[] {
  return fn
    .toString()
    .slice(fn.toString().indexOf("(") + 1, fn.toString().indexOf(")"))
    .split(",")
    .map((p) => p.trim().split("=")[0]?.trim())
    .filter((p) => p && !p.match(/^\{/) && p !== "options");
}

export function transformDates(
  obj: any,
  convertStringsToDates: boolean = true
): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (
    convertStringsToDates &&
    typeof obj === "string" &&
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/.test(
      obj
    )
  ) {
    return new Date(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => transformDates(item, convertStringsToDates));
  }
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        transformDates(value, convertStringsToDates),
      ])
    );
  }
  return obj;
}

export function inferHttpMethod(methodSource: string, debug?: boolean): string {
  const methodMatches = [
    ...methodSource.matchAll(/method:\s*['"]?(\w+)['"]?/gi),
  ];
  const method =
    methodMatches.length > 0
      ? methodMatches[methodMatches.length - 1][1].toUpperCase()
      : "GET";
  if (debug) {
    console.log(`[inferHttpMethod] Source:`, methodSource);
    console.log(
      `[inferHttpMethod] All matches:`,
      methodMatches.map((m) => m[0])
    );
    console.log(`[inferHttpMethod] Extracted method:`, method);
  }
  return method;
}
