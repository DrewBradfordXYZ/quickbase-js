import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { OpenAPIV2 } from "openapi-types";
import { Project, PropertySignature } from "ts-morph";
import { PropertyDetail, ParamDetail } from "../generate-unified-interface";
import { simplifyName } from "../../src/utils.ts";

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
  availableModels: string[],
  depth: number = 0,
  visited: Set<string> = new Set()
): any[] {
  console.log(
    `Parsing interface properties for ${modelName} at depth ${depth}`
  );
  if (depth > 10 || visited.has(modelName)) {
    console.warn(
      `Recursion limit reached or circular reference detected for ${modelName}`
    );
    return [];
  }
  visited.add(modelName);

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

  const props = interfaceDec.getProperties().map((prop: PropertySignature) => {
    const jsDocs = prop.getJsDocs();
    const jsdocText =
      jsDocs.length > 0 ? jsDocs[0].getDescription().trim() : undefined;
    const propType = prop.getType().getText(prop);
    let properties: any[] | undefined = undefined;

    console.log(
      `Processing property ${prop.getName()} with type ${propType} in ${modelName}`
    );
    const arrayMatch = propType.match(/(.+)\[\]$/);
    if (arrayMatch) {
      const innerType = arrayMatch[1].trim();
      console.log(`Found array type ${propType}, inner type: ${innerType}`);
      if (availableModels.includes(innerType) && !innerType.includes("[]")) {
        properties = parseInterfaceProperties(
          innerType,
          modelsDir,
          availableModels,
          depth + 1,
          visited
        );
        console.log(
          `Nested properties for ${innerType} in ${modelName}:`,
          properties
        );
      } else {
        console.log(
          `Skipping recursion for ${innerType} - not in availableModels or nested array`
        );
      }
    } else {
      console.log(`No array match for ${propType} in ${modelName}`);
    }

    const propDetail = {
      name: prop.getName(),
      type: propType,
      required: !prop.hasQuestionToken(),
      jsdoc: jsdocText,
      properties: properties && properties.length > 0 ? properties : undefined,
    };
    console.log(
      `Property detail for ${prop.getName()} in ${modelName}:`,
      propDetail
    );
    return propDetail;
  });

  console.log(`Completed parsing ${modelName}, properties:`, props);
  return props;
}

export function generateDocsJson(
  specFile: string,
  modelsDir: string,
  outputFile: string
): void {
  console.log("Generating docs JSON...");
  const spec: OpenAPIV2.Document = JSON.parse(readFileSync(specFile, "utf8"));
  const availableModels = readdirSync(modelsDir)
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
            console.log(`Parameter ${param.name} type: ${type}`);
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
          const paramDetail = {
            name: param.in === "body" ? "body" : param.name,
            type,
            required: param.required || false,
            description: param.description || "",
            properties,
          };
          console.log(`Parameter detail for ${opId}:`, paramDetail);
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
      console.log(`Return types for ${opId}:`, returnTypes);

      const returnTypeDetailsRaw = returnTypes
        .filter((type) => type !== "void" && availableModels.includes(type))
        .map((type) =>
          parseInterfaceProperties(type, modelsDir, availableModels)
        )
        .flat();
      console.log(
        `Return type details for ${opId} before final mapping:`,
        returnTypeDetailsRaw
      );

      const returnTypeDetails = returnTypeDetailsRaw.map((prop: any) => {
        console.log(
          `Mapping property ${
            prop.name
          } for ${opId}, has properties: ${!!prop.properties}`
        );
        if (prop.properties && prop.properties.length > 0) {
          console.log(
            `Expanding nested properties for ${prop.name} in ${opId}:`,
            prop.properties
          );
          return { ...prop, properties: [...prop.properties] };
        }
        return { ...prop };
      });
      console.log(`Final return type details for ${opId}:`, returnTypeDetails);

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

  console.log("Writing docs data to file:", docsData);
  writeFileSync(outputFile, JSON.stringify(docsData, null, 2), "utf8");
  console.log("Generated docs JSON:", outputFile);
}
