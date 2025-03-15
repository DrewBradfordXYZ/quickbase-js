// open-api/generate-unified-interface.ts

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { OpenAPIV2 } from "openapi-types";
import { simplifyName } from "../src/utils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
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
    const camelModel = model.charAt(0).toLowerCase() + model.slice(1);
    if (availableModels.includes(pascalModel)) {
      modelImports.add(pascalModel);
      return pascalModel;
    } else if (availableModels.includes(camelModel)) {
      modelImports.add(camelModel);
      return camelModel;
    }
    missingTypes.add(pascalModel);
    console.warn(
      `Type ${pascalModel} not found in /generated/models, defaulting to 'any'`
    );
    return "any";
  }

  if ("type" in schema) {
    if (schema.type === "object" && schema.properties) {
      const props = schema.properties;
      if (props.data && props.data.format === "binary") {
        return "ArrayBuffer"; // Map binary object to ArrayBuffer
      }
      if (props.content && props.content.format === "yaml") {
        return "string"; // Map YAML object to string
      }
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
    if (schema.type === "object" && schema.additionalProperties) {
      const additionalProps = schema.additionalProperties as
        | OpenAPIV2.SchemaObject
        | OpenAPIV2.ReferenceObject
        | boolean;
      if (typeof additionalProps === "boolean") {
        return "{ [key: string]: any }";
      }
      const valueType = mapRefToType(
        additionalProps,
        modelImports,
        spec,
        depth + 1,
        availableModels,
        missingTypes
      );
      return `{ [key: string]: ${valueType} }`;
    }
    return mapOpenApiTypeToTs(schema.type);
  }

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
      const summary = op.summary || "No description available.";
      const params = (op.parameters || [])
        .filter((p) => {
          const param = p as OpenAPIV2.Parameter;
          return !["QB-Realm-Hostname", "Authorization", "User-Agent"].includes(
            "name" in param ? param.name : ""
          );
        })
        .map((param: OpenAPIV2.Parameter) => {
          if (!("name" in param)) return "";
          let type: string;
          if ("schema" in param && param.schema) {
            type = mapRefToType(
              param.schema,
              modelImports,
              spec,
              1,
              availableModels,
              missingTypes
            );
          } else if ("type" in param && param.type) {
            type = mapOpenApiTypeToTs(param.type);
          } else {
            console.warn(
              `Parameter ${param.name} in ${opId} has no type or schema, defaulting to 'any'`
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
      const returnTypes = successResponses.map(({ response }) =>
        mapRefToType(
          response!.schema,
          modelImports,
          spec,
          1,
          availableModels,
          missingTypes
        )
      );
      const uniqueReturnTypes = [...new Set(returnTypes)];
      const returnType =
        uniqueReturnTypes.length > 1
          ? uniqueReturnTypes.join(" | ")
          : uniqueReturnTypes[0] || "void";

      const jsDoc = [
        `  /**`,
        `   * ${summary}`,
        `   * @param params - Parameters for the ${opId} operation`,
        `   * @returns A promise resolving to the ${opId} response`,
        `   */`,
      ].join("\n");

      methods.push(
        `${jsDoc}\n  ${opId}: (params: { ${params} }) => Promise<${returnType}>;`
      );
    }
  }

  // Always write the missing-types-report.json to reflect the current state
  if (missingTypes.size > 0) {
    console.log(
      "Missing types detected (defaulted to 'any'):",
      Array.from(missingTypes)
    );
  } else {
    console.log("No missing types detected.");
  }
  writeFileSync(
    join(OUTPUT_DIR, "missing-types-report.json"),
    JSON.stringify({ missingTypes: Array.from(missingTypes) }, null, 2)
  );
  console.log("Missing types report saved to missing-types-report.json");

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
