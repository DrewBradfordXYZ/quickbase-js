#!/usr/bin/env node
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { OpenAPIV2 } from "openapi-types";
import { Project, PropertySignature } from "ts-morph";
import {
  PropertyDetail,
  ParamDetail,
  mapOpenApiTypeToTs,
  mapRefToType,
  parseInterfaceProperties,
} from "./sharedUtils.ts";
import { simplifyName } from "../../src/utils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_FILE = join(__dirname, "..", "output", "quickbase-fixed.json");
const MODELS_DIR = join(__dirname, "..", "..", "src", "generated", "models");
const DOCS_DATA_DIR = join(__dirname, "..", "..", "docs-data");
const DOCS_JSON_FILE = join(DOCS_DATA_DIR, "api-docs.json");

function generateDocsJson(): void {
  console.log("Generating docs JSON...");

  if (!existsSync(SPEC_FILE)) {
    console.error(
      `Spec file ${SPEC_FILE} not found. Run 'npm run fix-spec' first.`
    );
    process.exit(1);
  }

  const spec: OpenAPIV2.Document = JSON.parse(readFileSync(SPEC_FILE, "utf8"));
  const availableModels = readdirSync(MODELS_DIR)
    .filter((file) => file.endsWith(".ts") && !file.startsWith("index"))
    .map((file) => file.replace(".ts", ""));
  const modelImports = new Set<string>();
  const missingTypes = new Set<string>();
  const docsData: any[] = [];

  for (const [path, methodsObj] of Object.entries(
    spec.paths as OpenAPIV2.PathsObject
  )) {
    if (!methodsObj) continue;
    for (const [method, operation] of Object.entries(
      methodsObj as OpenAPIV2.PathItemObject
    )) {
      const op = operation as OpenAPIV2.OperationObject | undefined;
      if (!op || !op.operationId) continue;

      const opId = simplifyName(op.operationId);
      console.log(`Processing operation ${opId} (${method} ${path})`);
      const paramDetails = (op.parameters || [])
        .filter(
          (p) =>
            !["QB-Realm-Hostname", "Authorization", "User-Agent"].includes(
              (p as OpenAPIV2.ParameterObject).name || ""
            )
        )
        .map((p) => {
          const param = p as OpenAPIV2.ParameterObject;
          let type = "any";
          let properties: PropertyDetail[] | undefined = undefined;
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
              properties = parseInterfaceProperties(
                pascalModel,
                MODELS_DIR,
                availableModels
              );
            } else if (type !== "any" && availableModels.includes(type)) {
              properties = parseInterfaceProperties(
                type,
                MODELS_DIR,
                availableModels
              );
            }
          } else if ("type" in p) {
            type = mapOpenApiTypeToTs(p.type);
          }
          const paramDetail = {
            name: param.in === "body" ? "body" : param.name,
            type,
            required: param.required || false,
            description: param.description || "",
            properties,
          };
          return paramDetail;
        });

      const returnTypes = ["200", "207"]
        .map(
          (code) => (op.responses?.[code] as OpenAPIV2.ResponseObject)?.schema
        )
        .filter(Boolean)
        .map((schema) =>
          mapRefToType(
            schema!,
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

      const returnTypeDetailsRaw = returnTypes
        .filter((type) => type !== "void" && availableModels.includes(type))
        .map((type) =>
          parseInterfaceProperties(type, MODELS_DIR, availableModels)
        )
        .flat();

      const returnTypeDetails = returnTypeDetailsRaw.map((prop: any) => {
        if (prop.properties && prop.properties.length > 0) {
          return { ...prop, properties: [...prop.properties] };
        }
        return { ...prop };
      });

      docsData.push({
        name: opId,
        summary: op.summary || "No description.",
        method: method.toUpperCase(),
        path,
        parameters: paramDetails,
        returns: returnType,
        returnTypeDetails:
          returnTypeDetails.length > 0 ? returnTypeDetails : undefined,
        docLink: `https://developer.quickbase.com/operation/${op.operationId}`,
      });
    }
  }

  if (!existsSync(DOCS_DATA_DIR)) {
    mkdirSync(DOCS_DATA_DIR, { recursive: true });
  }
  writeFileSync(DOCS_JSON_FILE, JSON.stringify(docsData, null, 2), "utf8");
  console.log("Generated docs JSON:", DOCS_JSON_FILE);
}

try {
  generateDocsJson();
} catch (error) {
  console.error("Error in generateDocsJson:", error);
  process.exit(1);
}

console.log("Script completed");
