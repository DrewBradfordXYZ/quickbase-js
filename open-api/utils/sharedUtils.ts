#!/usr/bin/env node

import { OpenAPIV2 } from "openapi-types";
import { join } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { Project, PropertySignature, ts } from "ts-morph"; // Import ts from ts-morph
import { simplifyName } from "../../src/utils/QuickbaseUtils.ts";

// (Existing interfaces remain unchanged)
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
  description?: string;
}

export interface JsDocOptions {
  summary: string;
  opId: string;
  paramDetails: ParamDetail[];
  returnType: string;
  returnTypeDetails: PropertyDetail[];
  docLink: string;
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
  availableModels?: string[],
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

  // Try to get the interface first
  let interfaceDec = sourceFile.getInterface(modelName);
  if (!interfaceDec) {
    // If no interface, check for a type alias (e.g., array type)
    const typeAlias = sourceFile.getTypeAlias(modelName);
    if (typeAlias) {
      const typeNode = typeAlias.getTypeNode();
      if (typeNode && typeNode.getKindName() === "ArrayType") {
        const elementType = typeNode.getFirstChildByKindOrThrow(
          ts.SyntaxKind.TypeReference // Use ts.SyntaxKind from ts-morph
        );
        const innerType = elementType.getText(); // e.g., "GetFields200ResponseItemsInner"
        if (availableModels?.includes(innerType)) {
          console.log(
            `Detected array type alias ${modelName}, parsing inner type ${innerType}`
          );
          // Recursively parse the inner interface
          return parseInterfaceProperties(
            innerType,
            modelsDir,
            availableModels,
            depth + 1,
            visited
          );
        } else {
          console.warn(
            `Inner type ${innerType} not found in available models for ${modelName}`
          );
          return [];
        }
      }
    }
    console.warn(
      `Interface or supported type alias ${modelName} not found in ${filePath}`
    );
    return [];
  }

  // Parse properties of the interface
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

export interface OperationDoc {
  name: string;
  summary: string;
  method: string;
  path: string;
  parameters: ParamDetail[];
  returns: string;
  returnTypeDetails: PropertyDetail[] | undefined;
  docLink: string;
}

export function parseOpenApiOperations(
  specFile: string,
  modelsDir: string
): {
  operations: OperationDoc[];
  modelImports: Set<string>;
  missingTypes: Set<string>;
} {
  if (!existsSync(specFile)) {
    throw new Error(
      `Spec file ${specFile} not found. Run 'npm run fix-spec' first.`
    );
  }
  const spec: OpenAPIV2.Document = JSON.parse(readFileSync(specFile, "utf8"));
  const availableModels = readdirSync(modelsDir)
    .filter((file) => file.endsWith(".ts") && !file.startsWith("index"))
    .map((file) => file.replace(".ts", ""));
  const modelImports = new Set<string>();
  const missingTypes = new Set<string>();
  const operations: OperationDoc[] = [];
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
                modelsDir,
                availableModels
              );
            } else if (type !== "any" && availableModels.includes(type)) {
              properties = parseInterfaceProperties(
                type,
                modelsDir,
                availableModels
              );
            }
          } else if ("type" in p) {
            type = mapOpenApiTypeToTs(p.type);
          }
          return {
            name: param.in === "body" ? "body" : param.name,
            type,
            required: param.required || false,
            description: param.description || "",
            properties: properties || [],
          };
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
          parseInterfaceProperties(type, modelsDir, availableModels)
        )
        .flat();
      const returnTypeDetails =
        returnTypeDetailsRaw.length > 0
          ? returnTypeDetailsRaw.map((prop) => ({
              ...prop,
              properties:
                prop.properties && prop.properties.length > 0
                  ? [...prop.properties]
                  : undefined,
            }))
          : undefined;
      operations.push({
        name: opId,
        summary: op.summary || "No description.",
        method: method.toUpperCase(),
        path,
        parameters: paramDetails,
        returns: returnType,
        returnTypeDetails,
        docLink: `https://developer.quickbase.com/operation/${op.operationId}`,
      });
    }
  }
  return { operations, modelImports, missingTypes };
}

// New shared function
export function getPropertyDescription(prop: PropertyDetail): string {
  return prop.jsdoc
    ? prop.jsdoc.replace(/@type\s*{[^}]+}\s*@memberof\s*\w+/, "").trim()
    : `Type: ${prop.type}`;
}
