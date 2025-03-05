import {
  AppsApiAxiosParamCreator,
  FieldsApiAxiosParamCreator,
  RecordsApiAxiosParamCreator,
  TablesApiAxiosParamCreator,
} from "./generated/api.js";
import { Configuration } from "./generated/configuration.js";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

type ApiMethod = (...args: any[]) => Promise<{ url: string; options: any }>;
type ApiMethods = { [key: string]: ApiMethod };

const simplifyName = (name: string): string =>
  name
    .replace(/ById$/, "")
    .replace(/Api$/, "")
    .replace(/^(\w)/, (_, c) => c.toLowerCase());

function getParamNames(fn: ApiMethod): string[] {
  const fnStr = fn.toString();
  const paramStr = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"));
  const params = paramStr
    .split(",")
    .map((p) => p.trim().split("=")[0].trim())
    .filter((p) => p && !p.match(/^\{/));
  return params;
}

function inferParamTypes(fn: ApiMethod, paramNames: string[]): string[] {
  const fnStr = fn.toString();
  const paramDefs = fnStr
    .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
    .split(",")
    .map((p) => p.trim());
  return paramNames.map((name) => {
    const paramDef = paramDefs.find((p) => p.startsWith(name));
    if (!paramDef) return "any";
    if (paramDef.includes("?:") || paramDef.includes("="))
      // Optional if ? or default value
      return paramDef.split(":")[1]?.trim().replace("?", "") + " | undefined";
    if (
      name === "appId" ||
      name === "tableId" ||
      name === "fieldId" ||
      name === "relationshipId"
    )
      return "string";
    if (name === "userAgent") return "string";
    if (name === "includeFieldPerms") return "boolean";
    if (name === "skip" || name === "top") return "number";
    if (name === "generated") return "any";
    return paramDef.split(":")[1]?.trim() || "any";
  });
}

function generateTypeDeclarations() {
  try {
    console.log("Starting generation...");
    const config = new Configuration();
    console.log("Config created:", config);

    const paramCreators: ((config?: Configuration) => ApiMethods)[] = [
      AppsApiAxiosParamCreator,
      FieldsApiAxiosParamCreator,
      RecordsApiAxiosParamCreator,
      TablesApiAxiosParamCreator,
    ];

    const methodMap: {
      [key: string]: { paramMap: string[]; paramTypes: string[] };
    } = {};
    for (const creator of paramCreators) {
      const apiMethods = creator(config);
      console.log(
        "API methods from",
        creator.name,
        ":",
        Object.keys(apiMethods)
      );
      for (const [methodName, method] of Object.entries(apiMethods) as [
        string,
        ApiMethod,
      ][]) {
        const friendlyName = simplifyName(methodName);
        const paramNames = getParamNames(method).filter(
          (name) =>
            name !== "qBRealmHostname" &&
            name !== "authorization" &&
            name !== "options"
        );
        const paramTypes = inferParamTypes(method, paramNames);
        console.log(
          `Method ${friendlyName}: params=${paramNames}, types=${paramTypes}`
        );
        methodMap[friendlyName] = { paramMap: paramNames, paramTypes };
      }
    }
    console.log("Method map:", methodMap);

    let dtsContent = `// Auto-generated type declarations for QuickbaseClient\n\n`;
    dtsContent += `export interface QuickbaseMethods {\n`;
    for (const [methodName, { paramMap, paramTypes }] of Object.entries(
      methodMap
    )) {
      const params = paramMap
        .map((name, i) => {
          const type = paramTypes[i] || "any";
          const isOptional =
            type.includes("| undefined") ||
            name === "generated" ||
            name === "userAgent" ||
            name === "includeFieldPerms";
          return `${name}${isOptional ? "?" : ""}: ${type.replace("| undefined", "")}`;
        })
        .join(", ");
      dtsContent += `  ${methodName}(params: { ${params} }): Promise<any>;\n`;
    }
    dtsContent += `}\n\n`;
    dtsContent += `export class QuickbaseClient implements QuickbaseMethods {}\n`;

    const outputPath = join(__dirname, "..", "types", "QuickbaseClient.d.ts");
    writeFileSync(outputPath, dtsContent, "utf8");
    console.log(`Generated type declarations at ${outputPath}`);
  } catch (error) {
    console.error("Error in generateTypeDeclarations:", error);
  }
}

generateTypeDeclarations();
