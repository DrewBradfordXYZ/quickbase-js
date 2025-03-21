import { OpenAPIV2 } from "openapi-types";
import { join } from "path";
import { Project, PropertySignature } from "ts-morph";
import { existsSync } from "fs";

export interface PropertyDetail {
  name: string;
  type: string;
  required: boolean;
  jsdoc?: string;
  properties?: PropertyDetail[];
}

export interface ParamDetail {
  name: string;
  type: string;
  required: boolean;
  properties: PropertyDetail[];
}

export function mapOpenApiTypeToTs(
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

export function mapRefToType(
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

export function parseInterfaceProperties(
  modelName: string,
  modelsDir: string,
  availableModels?: string[], // Optional for generate-unified-interface.ts
  depth: number = 0,
  visited: Set<string> = new Set()
): PropertyDetail[] {
  if (availableModels && (depth > 10 || visited.has(modelName))) {
    console.warn(
      `Recursion limit reached or circular reference detected for ${modelName}`
    );
    return [];
  }
  if (availableModels) visited.add(modelName);

  const project = new Project();
  const filePath = join(modelsDir, `${modelName}.ts`);
  if (!existsSync(filePath)) {
    console.warn(`Model file ${filePath} not found for ${modelName}`);
    return [];
  }

  const sourceFile = project.addSourceFileAtPath(filePath);
  const interfaceDec = sourceFile.getInterface(modelName);
  if (!interfaceDec) {
    console.warn(`Interface ${modelName} not found in ${filePath}`);
    return [];
  }

  return interfaceDec.getProperties().map((prop: PropertySignature) => {
    const jsDocs = prop.getJsDocs();
    const jsdocText =
      jsDocs.length > 0 ? jsDocs[0].getDescription().trim() : undefined;
    const propType = prop.getType().getText(prop);
    let properties: PropertyDetail[] | undefined = undefined;

    if (availableModels) {
      const arrayMatch = propType.match(/(.+)\[\]$/);
      if (arrayMatch) {
        const innerType = arrayMatch[1].trim();
        if (availableModels.includes(innerType) && !innerType.includes("[]")) {
          properties = parseInterfaceProperties(
            innerType,
            modelsDir,
            availableModels,
            depth + 1,
            visited
          );
        }
      }
    }

    return {
      name: prop.getName(),
      type: propType,
      required: !prop.hasQuestionToken(),
      jsdoc: jsdocText,
      properties: properties && properties.length > 0 ? properties : undefined,
    };
  });
}
