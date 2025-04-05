// open-api/fix-generated.ts
import fs from "fs";
import path from "path";

const generatedDir = path.join(__dirname, "../src/generated/models");
const specPath = path.join(
  __dirname,
  "../specs/QuickBase_RESTful_API_2025-03-04T06_22_39.725Z.json"
);
const fixedSpecPath = path.join(__dirname, "output/quickbase-fixed.json");

interface Spec {
  paths: { [key: string]: { [method: string]: Operation } };
  definitions?: { [key: string]: any };
}

interface Operation {
  operationId?: string;
  responses: { [status: string]: { schema?: any } };
}

function loadSpec(filePath: string): Spec {
  const specContent = fs.readFileSync(filePath, "utf8");
  return JSON.parse(specContent) as Spec;
}

function getRawArrayResponses(spec: Spec): Map<string, string> {
  const rawArrayMap = new Map<string, string>(); // operationId -> itemType

  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation = spec.paths[pathKey][method];
      const opId =
        operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
      const response = operation.responses?.["200"]?.schema;

      if (response?.type === "array" && response.items?.$ref) {
        const itemType = response.items.$ref.split("/").pop()!;
        rawArrayMap.set(opId, itemType);
      }
    }
  }

  return rawArrayMap;
}

function fixRawArrayFiles() {
  const spec = loadSpec(fixedSpecPath); // Use the fixed spec
  const rawArrayResponses = getRawArrayResponses(spec);
  const files = fs
    .readdirSync(generatedDir)
    .filter((f) => f.endsWith("200Response.ts"));

  files.forEach((file) => {
    const filePath = path.join(generatedDir, file);
    let content = fs.readFileSync(filePath, "utf8");

    if (content.includes("extends Array<any>")) {
      const responseName = file.replace(".ts", "");
      const opIdMatch = responseName.match(/^([A-Za-z]+)\d+Response$/);
      const opId = opIdMatch
        ? opIdMatch[1]
        : responseName.replace("200Response", "");

      const itemType = rawArrayResponses.get(opId);
      if (!itemType) {
        console.warn(
          `No item type found for ${opId} in spec, skipping ${file}`
        );
        return;
      }

      content = content
        .replace(
          `export interface ${responseName} extends Array<any> {}`,
          `export type ${responseName} = Array<${itemType}>`
        )
        .replace(
          `export function ${responseName}FromJSONTyped(json: any, ignoreDiscriminator: boolean): ${responseName} {\n    return json;\n}`,
          `export function ${responseName}FromJSONTyped(json: any, ignoreDiscriminator: boolean): ${responseName} {
            if (json == null) return [];
            return json.map(${itemType}FromJSON);
          }`
        )
        .replace(
          `export function ${responseName}ToJSON(value?: ${responseName} | null): any {\n    return value;\n}`,
          `export function ${responseName}ToJSON(value?: ${responseName} | null): any {
            if (value == null) return value;
            return value.map(${itemType}ToJSON);
          }`
        );

      // Ensure import for itemType (e.g., Field, Event)
      if (!content.includes(`import { ${itemType}FromJSON`)) {
        content = `import { ${itemType}FromJSON, ${itemType}ToJSON } from './${itemType}';\n${content}`;
      }

      fs.writeFileSync(filePath, content, { encoding: "utf8" });
      console.log(`Fixed ${file} to use Array<${itemType}>`);
    }
  });
}

fixRawArrayFiles();
