// open-api/generate-unified-interface.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { OpenAPIV2 } from "openapi-types";
import { simplifyName } from "../src/utils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_FILE = join(__dirname, "output", "quickbase-fixed.json");
const OUTPUT_DIR = join(__dirname, "..", "src", "generated-unified");
const OUTPUT_FILE = join(OUTPUT_DIR, "QuickbaseClient.ts");

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
  modelImports: Set<string>,
  spec: OpenAPIV2.Document,
  depth: number = 0
): string {
  const indent = "  ".repeat(depth);
  console.log(`${indent}Processing schema:`, JSON.stringify(schema, null, 2));

  if (!schema) {
    console.log(`${indent}No schema, returning 'any'`);
    return "any";
  }

  if ("$ref" in schema && schema.$ref) {
    const refParts = schema.$ref.split("/");
    const model = refParts[refParts.length - 1];
    const camelModel = model.charAt(0).toUpperCase() + model.slice(1);
    console.log(
      `${indent}Found $ref: ${schema.$ref}, adding ${camelModel} to imports`
    );
    modelImports.add(camelModel);
    return camelModel;
  }

  if ("type" in schema) {
    if (schema.type === "array" && schema.items) {
      console.log(`${indent}Array type, traversing items`);
      const items = schema.items as
        | OpenAPIV2.SchemaObject
        | OpenAPIV2.ReferenceObject;
      const itemType = mapRefToType(items, modelImports, spec, depth + 1);
      return `${itemType}[]`;
    }

    if (schema.type === "object") {
      console.log(`${indent}Object type`);
      if (schema.additionalProperties) {
        const additionalProps = schema.additionalProperties as
          | OpenAPIV2.SchemaObject
          | OpenAPIV2.ReferenceObject
          | boolean;
        if (typeof additionalProps === "boolean") {
          console.log(
            `${indent}Additional properties boolean, returning generic object`
          );
          return "{ [key: string]: any }";
        }
        console.log(`${indent}Traversing additional properties`);
        const valueType = mapRefToType(
          additionalProps,
          modelImports,
          spec,
          depth + 1
        );
        return `{ [key: string]: ${valueType} }`;
      }
      if (schema.properties) {
        console.log(`${indent}Traversing object properties`);
        const props = Object.entries(schema.properties).map(([key, prop]) => {
          const propSchema = prop as OpenAPIV2.SchemaObject;
          const propType = mapRefToType(
            propSchema,
            modelImports,
            spec,
            depth + 1
          );
          return `${key}${propSchema.required ? "" : "?"}: ${propType}`;
        });
        return `{ ${props.join("; ")} }`;
      }
      console.log(
        `${indent}No properties or additionalProperties, returning generic object`
      );
      return "{ [key: string]: any }";
    }

    const basicType = mapOpenApiTypeToTs(schema.type);
    console.log(`${indent}Basic type: ${basicType}`);
    return basicType;
  }

  console.log(`${indent}Unknown schema, returning 'any'`);
  return "any";
}

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
      console.log(`Processing operation: ${opId}`);

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

          let type: string;
          if ("schema" in param && param.schema) {
            console.log(`Mapping schema for parameter: ${param.name}`);
            type = mapRefToType(param.schema, modelImports, spec, 1);
          } else if ("type" in param && param.type) {
            console.log(`Mapping basic type for parameter: ${param.name}`);
            type = mapOpenApiTypeToTs(param.type);
          } else {
            console.log(
              `No schema or type for parameter: ${param.name}, using 'any'`
            );
            type = "any";
          }
          const paramName = param.in === "body" ? "body" : param.name;
          return `${paramName}${param.required ? "" : "?"}: ${type}`;
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
      const returnTypes = successResponses.map(({ response }) => {
        console.log(`Mapping response schema for code: ${response!.code}`);
        return mapRefToType(response!.schema, modelImports, spec, 1);
      });
      const uniqueReturnTypes = [...new Set(returnTypes)];
      const returnType =
        uniqueReturnTypes.length > 1
          ? uniqueReturnTypes.join(" | ")
          : uniqueReturnTypes[0] || "void";

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
  console.log(`Imports: ${Array.from(modelImports).join(", ")}`);

  const interfaceContent = `// Generated on ${new Date().toISOString()}\n${importStatement}\n\nexport interface QuickbaseClient {\n${methods.join(
    "\n"
  )}\n}\n`;

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  writeFileSync(OUTPUT_FILE, interfaceContent, "utf8");
  console.log(`Generated ${OUTPUT_FILE}`);
}

try {
  generateInterface();
} catch (error) {
  console.error("Generation failed:", error);
  process.exit(1);
}
