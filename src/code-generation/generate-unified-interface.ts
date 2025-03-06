#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { simplifyName } from "../utils.ts";
import { OpenAPIV3 } from "openapi-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_FILE = join(__dirname, "quickbase-fixed.json");
const OUTPUT_DIR = join(__dirname, "..", "generated-unified");
const OUTPUT_FILE = join(OUTPUT_DIR, "QuickbaseClient.ts");

function generateInterface() {
  if (!existsSync(SPEC_FILE)) {
    console.error(
      `Spec file ${SPEC_FILE} not found. Run 'npm run fix-spec' first.`
    );
    process.exit(1);
  }

  console.log("Generating unified QuickbaseClient interface...");
  const spec = JSON.parse(
    readFileSync(SPEC_FILE, "utf8")
  ) as OpenAPIV3.Document;
  const { paths } = spec;

  const modelImports = new Set<string>();
  const methods: string[] = [];

  for (const [path, methodsObj] of Object.entries(
    paths as OpenAPIV3.PathsObject
  )) {
    if (!methodsObj) continue; // Guard against undefined PathItemObject

    for (const [method, operation] of Object.entries(
      methodsObj as OpenAPIV3.PathItemObject
    )) {
      const op = operation as OpenAPIV3.OperationObject | undefined;
      if (!op || !op.operationId) continue;

      const opId = simplifyName(op.operationId);
      const params = (op.parameters || [])
        .filter((p) => {
          const param = p as OpenAPIV3.ParameterObject;
          return !["QB-Realm-Hostname", "Authorization", "User-Agent"].includes(
            param.name
          );
        })
        .map((p) => {
          const param = p as OpenAPIV3.ParameterObject;
          const type = param.schema
            ? mapRefToType(param.schema, modelImports)
            : "any";
          return `${param.name}${param.required ? "" : "?"}: ${type}`;
        })
        .join("; ");
      const response = op.responses?.["200"] as
        | OpenAPIV3.ResponseObject
        | undefined;
      const returnType = response?.content?.["application/json"]?.schema
        ? mapRefToType(
            response.content["application/json"].schema,
            modelImports
          )
        : "void";
      methods.push(
        `  ${opId}: (params: { ${params} }) => Promise<${returnType}>;`
      );
    }
  }

  const importLines = Array.from(modelImports)
    .map((m) => `import { ${m} } from "../generated/models/${m}";`)
    .join("\n");
  const interfaceContent = `// Generated on ${new Date().toISOString()}\n${importLines}\n\nexport interface QuickbaseClient {\n${methods.join(
    "\n"
  )}\n}\n`;

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  writeFileSync(OUTPUT_FILE, interfaceContent, "utf8");
  console.log(`Generated ${OUTPUT_FILE}`);
}

function mapRefToType(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  modelImports: Set<string>
): string {
  if ("$ref" in schema) {
    const model = schema.$ref.split("/").pop()!;
    modelImports.add(model);
    return model;
  }
  if (schema.type === "array" && schema.items) {
    const itemType =
      "$ref" in schema.items
        ? schema.items.$ref.split("/").pop()!
        : schema.items.type || "any";
    if ("$ref" in schema.items) modelImports.add(itemType);
    return `${itemType}[]`;
  }
  return schema.type || "any";
}

try {
  generateInterface();
} catch (error) {
  console.error("Generation failed:", error);
  process.exit(1);
}
