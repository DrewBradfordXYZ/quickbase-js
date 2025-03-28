import { Operation, Parameter, Spec } from "../types/spec.ts";
import { inferSchema } from "../utils/infer-schema.ts";

export function enhanceGeneral(spec: Spec): void {
  spec.definitions = spec.definitions || {};

  if (!spec.definitions["Record"]) {
    spec.definitions["Record"] = {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: { value: { type: "string" } },
        required: ["value"],
      },
      description: "A generic QuickBase record with field ID-value pairs",
    };
    console.log("Added Record to definitions");
  }

  if (!spec.definitions["Permission"]) {
    spec.definitions["Permission"] = {
      type: "object",
      properties: {
        role: { type: "string", description: "The role name" },
        permissionType: {
          type: "string",
          description: "Permission type (e.g., View, Modify)",
        },
        roleId: { type: "integer", description: "The role identifier" },
      },
      required: ["role", "permissionType", "roleId"],
      description: "A single permission entry for a field",
    };
    console.log("Added Permission to definitions");
  }

  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation: Operation = spec.paths[pathKey][method];
      const opId =
        operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;

      if (operation.parameters) {
        operation.parameters.forEach((param: Parameter) => {
          if (param.in !== "body" && !param.type && !param.schema) {
            param.type = param.name.includes("Id") ? "string" : "string";
            console.log(
              `Set default type 'string' for ${pathKey}(${method}).${param.name}`
            );
          }
        });
      }

      if (operation.responses) {
        for (const status in operation.responses) {
          const response = operation.responses[status];
          if (response.schema) {
            const cleanStatus = status.replace("/", "_");
            const responseName = `${opId}${cleanStatus}Response`;
            if (!spec.definitions[responseName]) {
              console.log(
                `Adding ${responseName} to definitions for ${pathKey}(${method})`
              );
              let schemaToUse = response.schema;
              // Only infer from example if schema is truly empty
              if (
                !schemaToUse.type &&
                !schemaToUse.items &&
                !schemaToUse.properties
              ) {
                if (response["x-amf-mediaType"]) {
                  const mediaType = response["x-amf-mediaType"];
                  if (mediaType === "application/octet-stream") {
                    schemaToUse = {
                      type: "object",
                      properties: {
                        data: { type: "string", format: "binary" },
                      },
                      description:
                        schemaToUse?.description || "Binary file content",
                    };
                  } else if (mediaType === "application/x-yaml") {
                    schemaToUse = {
                      type: "object",
                      properties: {
                        content: { type: "string", format: "yaml" },
                      },
                      description: "YAML-formatted data",
                    };
                  } else if (
                    mediaType === "application/json" &&
                    schemaToUse.example
                  ) {
                    schemaToUse = inferSchema(
                      schemaToUse.example,
                      responseName
                    );
                    schemaToUse.description =
                      response.description || `Response for ${opId}`;
                  }
                }
              }
              spec.definitions[responseName] = schemaToUse;
            }
            response.schema = { $ref: `#/definitions/${responseName}` };
          }
        }
      }
    }
  }
}
