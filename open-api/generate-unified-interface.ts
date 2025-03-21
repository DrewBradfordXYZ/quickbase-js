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

import { OpenAPIV2 } from "openapi-types";
console.log("openapi-types imported");

import { Project } from "ts-morph";
console.log("ts-morph imported");

import { generateJsDoc } from "./utils/generateJsDoc.ts";
import { simplifyName } from "../src/utils.ts";
import {
  PropertyDetail,
  ParamDetail,
  mapOpenApiTypeToTs,
  mapRefToType,
  parseInterfaceProperties,
} from "./utils/sharedUtils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log("__dirname set:", __dirname);

const SPEC_FILE = join(__dirname, "output", "quickbase-fixed.json");
const OUTPUT_DIR = join(__dirname, "..", "src", "generated-unified");
const OUTPUT_FILE = join(OUTPUT_DIR, "QuickbaseClient.ts");
const MODELS_DIR = join(__dirname, "..", "src", "generated", "models");

function generateInterface(includeResponseProperties: boolean = false): void {
  console.log(
    "Generating interface with includeResponseProperties:",
    includeResponseProperties
  );

  console.log("Checking spec file:", SPEC_FILE);
  if (!existsSync(SPEC_FILE)) {
    console.error(
      `Spec file ${SPEC_FILE} not found. Run 'npm run fix-spec' first.`
    );
    process.exit(1);
  }

  console.log("Reading spec file...");
  const specContent = readFileSync(SPEC_FILE, "utf8");
  const spec: OpenAPIV2.Document = JSON.parse(specContent);
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
      const docLink = `https://developer.quickbase.com/operation/${op.operationId}`;

      const paramDetails: ParamDetail[] = (op.parameters || [])
        .filter((p: OpenAPIV2.ParameterObject | OpenAPIV2.ReferenceObject) => {
          const param = p as OpenAPIV2.ParameterObject;
          return !["QB-Realm-Hostname", "Authorization", "User-Agent"].includes(
            param.name || ""
          );
        })
        .map((param: OpenAPIV2.ParameterObject | OpenAPIV2.ReferenceObject) => {
          const p = param as OpenAPIV2.ParameterObject;
          if (!p.name) return null;
          let type = "any";
          let properties: PropertyDetail[] = [];
          if ("schema" in p && p.schema) {
            type = mapRefToType(
              p.schema,
              modelImports,
              spec,
              1,
              availableModels,
              missingTypes
            );
            if ("$ref" in p.schema && p.schema.$ref) {
              const refParts = p.schema.$ref.split("/");
              const model = refParts[refParts.length - 1];
              const pascalModel =
                model.charAt(0).toUpperCase() + model.slice(1);
              properties = parseInterfaceProperties(pascalModel, MODELS_DIR);
            } else if (type !== "any" && availableModels.includes(type)) {
              properties = parseInterfaceProperties(type, MODELS_DIR);
            }
          } else if ("type" in p && p.type) {
            type = mapOpenApiTypeToTs(p.type);
          }
          const paramName = p.in === "body" ? "body" : p.name;
          return {
            name: paramName,
            type,
            required: p.required || false,
            properties,
          };
        })
        .filter((p): p is ParamDetail => p !== null);

      const params = paramDetails
        .map((p) => `${p.name}${p.required ? "" : "?"}: ${p.type}`)
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

      const returnTypeDetails: PropertyDetail[] =
        includeResponseProperties && returnTypes.length > 0
          ? returnTypes
              .filter(
                (type) => type !== "void" && availableModels.includes(type)
              )
              .flatMap((type) => parseInterfaceProperties(type, MODELS_DIR))
          : [];

      const jsDoc = generateJsDoc({
        summary,
        opId,
        paramDetails,
        returnType,
        returnTypeDetails,
        docLink,
      });

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
  generateInterface(true);
} catch (error) {
  console.error("Error in generateInterface:", error);
  process.exit(1);
}

console.log("Script completed");
