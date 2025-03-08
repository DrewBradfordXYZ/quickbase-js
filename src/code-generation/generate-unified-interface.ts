// src/code-generation/generate-unified-interface.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { simplifyName } from "../utils.ts";
import { OpenAPIV2 } from "openapi-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_FILE = join(__dirname, "output", "quickbase-fixed.json");
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
  ) as OpenAPIV2.Document;
  const { paths } = spec;

  const modelImports = new Set<string>();
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

      const opId = op.operationId; // Use operationId directly, no simplification
      const params = (op.parameters || [])
        .filter((p) => {
          const param = p as OpenAPIV2.ParameterObject;
          return !["QB-Realm-Hostname", "Authorization", "User-Agent"].includes(
            param.name
          );
        })
        .map((p) => {
          const param = p as OpenAPIV2.ParameterObject;
          const type = param.type
            ? mapOpenApiTypeToTs(param.type)
            : param.schema
            ? mapRefToType(param.schema, modelImports)
            : "any";
          return `${param.name}${param.required ? "" : "?"}: ${type}`;
        })
        .join("; ");
      const response = op.responses?.["200"] as
        | OpenAPIV2.ResponseObject
        | undefined;
      const returnType = response?.schema
        ? mapRefToType(response.schema, modelImports)
        : "void";
      methods.push(
        `  ${opId}: (params: { ${params} }) => Promise<${returnType}>;`
      );
    }
  }

  const importLines = Array.from(modelImports)
    .map((m) => `import { ${m} } from "../generated/models/${m}.ts";`)
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

function mapOpenApiTypeToTs(openApiType: string): string {
  switch (openApiType.toLowerCase()) {
    case "integer":
    case "int":
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
  schema: OpenAPIV2.SchemaObject | OpenAPIV2.ReferenceObject,
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
        : mapOpenApiTypeToTs(schema.items.type || "any");
    if ("$ref" in schema.items) modelImports.add(itemType);
    return `${itemType}[]`;
  }
  return mapOpenApiTypeToTs(schema.type || "any");
}

try {
  generateInterface();
} catch (error) {
  console.error("Generation failed:", error);
  process.exit(1);
}
