#!/usr/bin/env node
console.log("Script started");

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "fs";
console.log("FS modules imported");

import { join, dirname } from "path";
console.log("Path modules imported");

import { fileURLToPath } from "url";
console.log("URL module imported");

import { OpenAPIV2 } from "openapi-types"; // Use module name, not relative path
console.log("openapi-types imported");

// Temporary simplifyName fallback
const simplifyName = (str: string) => str;

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log("__dirname set:", __dirname);

const SPEC_FILE = join(__dirname, "output", "quickbase-fixed.json");
const OUTPUT_DIR = join(__dirname, "..", "src", "generated-unified");
const OUTPUT_FILE = join(OUTPUT_DIR, "QuickbaseClient.ts");
const MODELS_DIR = join(__dirname, "..", "src", "generated", "models");

function mapOpenApiTypeToTs(
  openApiType: string | string[] | undefined
): string {
  const type = Array.isArray(openApiType)
    ? openApiType[0]
    : openApiType || "any";
  switch (type.toLowerCase()) {
    case "integer":
    case "int":
    case "number":
      return "number";
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    default:
      return "any";
  }
}

function mapRefToType(
  schema: OpenAPIV2.SchemaObject | OpenAPIV2.ReferenceObject | undefined,
  modelImports: Set<string>,
  spec: OpenAPIV2.Document,
  depth: number = 0,
  availableModels: string[],
  missingTypes: Set<string>
): string {
  if (!schema) return "any";

  if ("$ref" in schema && schema.$ref) {
    const refParts = schema.$ref.split("/");
    const model = refParts[refParts.length - 1];
    const pascalModel = model.charAt(0).toUpperCase() + model.slice(1);
    if (availableModels.includes(pascalModel)) {
      modelImports.add(pascalModel);
      return pascalModel;
    }
    missingTypes.add(pascalModel);
    console.warn(`Type ${pascalModel} not found, defaulting to 'any'`);
    return "any";
  }

  if ("type" in schema) {
    if (schema.type === "object" && schema.properties) {
      const props = schema.properties;
      const propTypes = Object.entries(props).map(([key, prop]) => {
        const propSchema = prop as OpenAPIV2.SchemaObject;
        const propType = mapRefToType(
          propSchema,
          modelImports,
          spec,
          depth + 1,
          availableModels,
          missingTypes
        );
        return `${key}${propSchema.required ? "" : "?"}: ${propType}`;
      });
      return `{ ${propTypes.join("; ")} }`;
    }
    if (schema.type === "array" && schema.items) {
      const items = schema.items as
        | OpenAPIV2.SchemaObject
        | OpenAPIV2.ReferenceObject;
      const itemType = mapRefToType(
        items,
        modelImports,
        spec,
        depth + 1,
        availableModels,
        missingTypes
      );
      return `${itemType}[]`;
    }
    return mapOpenApiTypeToTs(schema.type);
  }

  return "any";
}

function generateInterface() {
  console.log("Checking spec file:", SPEC_FILE);
  if (!existsSync(SPEC_FILE)) {
    console.error(
      `Spec file ${SPEC_FILE} not found. Run 'npm run fix-spec' first.`
    );
    process.exit(1);
  }

  console.log("Reading spec file...");
  const specContent = readFileSync(SPEC_FILE, "utf8");
  const spec = JSON.parse(specContent) as OpenAPIV2.Document;
  console.log("Spec parsed, keys:", Object.keys(spec));

  const { paths } = spec;
  if (!paths) {
    console.error("No 'paths' in spec");
    process.exit(1);
  }

  console.log("Checking models directory:", MODELS_DIR);
  if (!existsSync(MODELS_DIR)) {
    console.error(
      `Models directory ${MODELS_DIR} not found. Run 'npm run gen:openapi' first.`
    );
    process.exit(1);
  }
  const availableModels = readdirSync(MODELS_DIR)
    .filter((file) => file.endsWith(".ts") && !file.startsWith("index"))
    .map((file) => file.replace(".ts", ""));
  console.log("Available models:", availableModels);

  const modelImports = new Set<string>();
  const missingTypes = new Set<string>();
  const methods: string[] = [];

  for (const [path, methodsObj] of Object.entries(
    paths as OpenAPIV2.PathsObject
  )) {
    if (!methodsObj) continue;
    for (const [method, operation] of Object.entries(
      methodsObj as OpenAPIV2.PathItemObject
    )) {
      const op = operation as OpenAPIV2.OperationObject | undefined;
      if (!op || !op.operationId) continue;

      const opId = simplifyName(op.operationId);
      const summary = op.summary || "No description.";
      const params = (op.parameters || [])
        .filter((p: OpenAPIV2.ParameterObject | OpenAPIV2.ReferenceObject) => {
          const param = p as OpenAPIV2.ParameterObject;
          return !["QB-Realm-Hostname", "Authorization", "User-Agent"].includes(
            param.name || ""
          );
        })
        .map((param: OpenAPIV2.ParameterObject | OpenAPIV2.ReferenceObject) => {
          const p = param as OpenAPIV2.ParameterObject;
          if (!p.name) return "";
          let type = "any";
          if ("schema" in p && p.schema) {
            type = mapRefToType(
              p.schema,
              modelImports,
              spec,
              1,
              availableModels,
              missingTypes
            );
          } else if ("type" in p && p.type) {
            type = mapOpenApiTypeToTs(p.type);
          }
          const paramName = p.in === "body" ? "body" : p.name;
          return `${paramName}${p.required ? "" : "?"}: ${type}`;
        })
        .filter((param) => param !== "")
        .join("; ");

      const returnTypes = ["200", "207"]
        .map(
          (code) => op.responses?.[code] as OpenAPIV2.ResponseObject | undefined
        )
        .filter((response) => response?.schema)
        .map((response) =>
          mapRefToType(
            response!.schema,
            modelImports,
            spec,
            1,
            availableModels,
            missingTypes
          )
        );
      const returnType =
        returnTypes.length > 1
          ? returnTypes.join(" | ")
          : returnTypes[0] || "void";

      const jsDoc = [
        `  /**`,
        `   * ${summary}`,
        `   * @param params - Parameters for ${opId}`,
        `   * @returns Promise resolving to ${opId} response`,
        `   */`,
      ].join("\n");

      methods.push(
        `${jsDoc}\n  ${opId}: (params: { ${params} }) => Promise<${returnType}>;`
      );
    }
  }

  console.log("Writing missing types report...");
  writeFileSync(
    join(OUTPUT_DIR, "missing-types-report.json"),
    JSON.stringify({ missingTypes: Array.from(missingTypes) }, null, 2)
  );

  const importStatement =
    modelImports.size > 0
      ? `import { ${Array.from(modelImports)
          .sort()
          .join(", ")} } from "../generated/models";`
      : "";
  const interfaceContent = `// Generated on ${new Date().toISOString()}\n${importStatement}\n\nexport interface QuickbaseClient {\n${methods.join(
    "\n"
  )}\n}\n`;

  console.log("Ensuring output directory exists...");
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  writeFileSync(OUTPUT_FILE, interfaceContent, "utf8");
  console.log("Generated:", OUTPUT_FILE);
}

console.log("Entering try block");
try {
  generateInterface();
} catch (error) {
  console.error("Error in generateInterface:", error);
  process.exit(1);
}

console.log("Script completed");
