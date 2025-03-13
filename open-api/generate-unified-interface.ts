// open-api/generate-unified-interface.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { OpenAPIV2 } from "openapi-types";
import { simplifyName } from "../src/utils.ts"; // Add this import

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_FILE = join(__dirname, "output", "quickbase-fixed.json");
const OUTPUT_DIR = join(__dirname, "..", "src", "generated-unified");
const OUTPUT_FILE = join(OUTPUT_DIR, "QuickbaseClient.ts");

// Remove the local simplifyName function
// (The rest of the file remains unchanged)

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

      const opId = simplifyName(op.operationId);
      const params = (op.parameters || [])
        .filter((p) => {
          const param = p as OpenAPIV2.Parameter;
          return !["QB-Realm-Hostname", "Authorization", "User-Agent"].includes(
            "name" in param ? param.name : ""
          );
        })
        .map((p) => {
          const param = p as OpenAPIV2.Parameter;
          if (!("name" in param)) return "";

          const type =
            "type" in param && param.type
              ? mapOpenApiTypeToTs(param.type)
              : "schema" in param && param.schema
              ? mapRefToType(param.schema, modelImports)
              : "any";
          return `${param.name}${param.required ? "" : "?"}: ${type}`;
        })
        .filter((param) => param !== "")
        .join("; ");

      const successResponses = ["200", "207"]
        .map((code) => ({
          code,
          response: op.responses?.[code] as
            | OpenAPIV2.ResponseObject
            | undefined,
        }))
        .filter(({ response }) => response?.schema);
      const returnTypes = successResponses.map(({ response }) =>
        mapRefToType(response!.schema, modelImports)
      );
      const uniqueReturnTypes = [...new Set(returnTypes)];
      const returnType =
        uniqueReturnTypes.length > 0 ? uniqueReturnTypes.join(" | ") : "void";

      methods.push(
        `  ${opId}: (params: { ${params} }) => Promise<${returnType}>;`
      );
    }
  }

  const importStatement =
    modelImports.size > 0
      ? `import { ${Array.from(modelImports)
          .sort()
          .join(", ")} } from "../generated/models";`
      : "";

  const interfaceContent = `// Generated on ${new Date().toISOString()}\n${importStatement}\n\nexport interface QuickbaseClient {\n${methods.join(
    "\n"
  )}\n}\n`;

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  writeFileSync(OUTPUT_FILE, interfaceContent, "utf8");
  console.log(`Generated ${OUTPUT_FILE}`);
}

function mapOpenApiTypeToTs(
  openApiType: string | string[] | undefined
): string {
  const type = Array.isArray(openApiType)
    ? openApiType[0]
    : openApiType || "any";
  switch (type.toLowerCase()) {
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
  schema: OpenAPIV2.SchemaObject | OpenAPIV2.ReferenceObject | undefined,
  modelImports: Set<string>
): string {
  if (!schema) return "any";

  // Handle ReferenceObject
  if ("$ref" in schema && schema.$ref) {
    const model = schema.$ref.split("/").pop()!;
    modelImports.add(model);
    return model;
  }

  // At this point, we know it's a SchemaObject (not a ReferenceObject)
  // But we still need to check for 'type' existence for TypeScript
  if (!("type" in schema)) return "any";

  if (schema.type === "array" && schema.items) {
    const items = schema.items as
      | OpenAPIV2.SchemaObject
      | OpenAPIV2.ReferenceObject;
    const itemType =
      "$ref" in items && items.$ref
        ? items.$ref.split("/").pop()!
        : mapOpenApiTypeToTs("type" in items ? items.type : undefined);
    if ("$ref" in items && items.$ref) modelImports.add(itemType);
    return `${itemType}[]`;
  }

  if (schema.type === "object" && schema.additionalProperties) {
    const additionalProps = schema.additionalProperties as
      | OpenAPIV2.SchemaObject
      | OpenAPIV2.ReferenceObject
      | boolean;
    if (typeof additionalProps === "boolean") {
      return "{ [key: string]: any }";
    }
    const valueType =
      "$ref" in additionalProps && additionalProps.$ref
        ? additionalProps.$ref.split("/").pop()!
        : mapOpenApiTypeToTs(
            "type" in additionalProps ? additionalProps.type : undefined
          );
    if ("$ref" in additionalProps && additionalProps.$ref)
      modelImports.add(valueType);
    return `{ [key: string]: ${valueType} }`;
  }

  return mapOpenApiTypeToTs(schema.type);
}

try {
  generateInterface();
} catch (error) {
  console.error("Generation failed:", error);
  process.exit(1);
}
