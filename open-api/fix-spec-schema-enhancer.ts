// open-api/fix-spec-schema-enhancer.ts
import { Operation, Parameter, Spec } from "./fix-spec-types.ts";
import { normalizeDefinitionName } from "./fix-spec-utils.ts";

function inferSchemaFromExample(example: any, operationId?: string): any {
  if (!example || typeof example !== "object") {
    return { type: "string" };
  }
  if (Array.isArray(example)) {
    return {
      type: "array",
      items:
        example.length > 0
          ? inferSchemaFromExample(example[0], operationId)
          : { type: "string" },
    };
  }
  const properties: Record<string, any> = {};
  for (const [key, value] of Object.entries(example)) {
    if (Array.isArray(value)) {
      properties[key] = {
        type: "array",
        items:
          value.length > 0
            ? inferSchemaFromExample(value[0], operationId)
            : { type: "string" },
      };
    } else if (typeof value === "object" && value !== null) {
      properties[key] = inferSchemaFromExample(value, operationId);
    } else {
      properties[key] = {
        type:
          typeof value === "object" && value === null
            ? "object"
            : typeof value || "string",
      };
    }
  }
  if (operationId && operationId.endsWith("200Response")) {
    return { type: "array", items: { type: "object", properties } };
  }
  return { type: "object", properties };
}

export function enhanceRawSpec(spec: Spec): void {
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
          if (param.in === "body") {
            if (!param.schema) param.schema = {};
            let requestName =
              param.schema.$ref?.split("/").pop() || `${opId}Request`;
            requestName = normalizeDefinitionName(requestName);

            if (spec.definitions[requestName]?.type === "array") {
              console.log(
                `Wrapping array schema for ${requestName} in ${pathKey}(${method})`
              );
              const arraySchema = spec.definitions[requestName];
              let wrapperPropName = operation.tags?.includes("Users")
                ? "userIds"
                : "items";
              if (
                operation.tags?.includes("Groups") &&
                operation.summary?.toLowerCase().includes("subgroup")
              ) {
                wrapperPropName = "groupIds";
              }
              spec.definitions[requestName] = {
                type: "object",
                properties: { [wrapperPropName]: arraySchema },
                required: arraySchema.minItems > 0 ? [wrapperPropName] : [],
                description:
                  arraySchema.description || `Request body for ${opId}`,
              };
            } else {
              let properties = spec.definitions[requestName]?.properties || {};
              if (
                !spec.definitions[requestName] ||
                !spec.definitions[requestName].type ||
                Object.keys(properties).length === 0
              ) {
                console.log(
                  `Defining schema for ${requestName} in ${pathKey}(${method})`
                );
                if (operation.tags?.includes("Users")) {
                  properties = {
                    userIds: { type: "array", items: { type: "string" } },
                  };
                } else if (
                  operation.tags?.includes("Groups") &&
                  operation.summary?.toLowerCase().includes("subgroup")
                ) {
                  properties = {
                    groupIds: { type: "array", items: { type: "string" } },
                  };
                } else if (
                  operation.tags?.includes("Records") &&
                  method === "post"
                ) {
                  properties = {
                    data: {
                      type: "array",
                      items: { $ref: "#/definitions/Record" },
                    },
                    to: { type: "string" },
                    fieldsToReturn: {
                      type: "array",
                      items: { type: "integer" },
                    },
                  };
                } else if (
                  operation.tags?.includes("Records") &&
                  method === "delete"
                ) {
                  properties = {
                    from: { type: "string" },
                    where: { type: "string" },
                  };
                } else if (
                  operation.tags?.includes("Records") &&
                  operation.summary?.toLowerCase().includes("query")
                ) {
                  properties = {
                    from: { type: "string" },
                    select: { type: "array", items: { type: "integer" } },
                    where: { type: "string" },
                  };
                } else if (operation.tags?.includes("Formulas")) {
                  properties = { formula: { type: "string" } };
                } else if (operation.tags?.includes("Apps")) {
                  if (pathKey.includes("/copy") && method === "post") {
                    properties = {
                      name: {
                        type: "string",
                        description: "The name of the new app.",
                      },
                      description: {
                        type: "string",
                        description: "A description for the new app.",
                      },
                      properties: {
                        type: "object",
                        properties: {
                          keepData: {
                            type: "boolean",
                            description: "Whether to copy data.",
                          },
                          excludeFiles: {
                            type: "boolean",
                            description: "Whether to exclude files.",
                          },
                          usersAndRoles: {
                            type: "boolean",
                            description: "Whether to copy users and roles.",
                          },
                          assignUserToken: {
                            type: "boolean",
                            description: "Whether to assign the user token.",
                          },
                        },
                        description:
                          "Options for customizing the app copy process.",
                      },
                    };
                  } else if (
                    !param.schema ||
                    !param.schema.properties ||
                    Object.keys(param.schema.properties).length === 0
                  ) {
                    console.log(
                      `No schema found for ${pathKey}(${method}), defining default`
                    );
                    properties = {
                      name: {
                        type: "string",
                        description: "The name of the app.",
                      },
                      description: {
                        type: "string",
                        description: "A description for the app.",
                      },
                      assignToken: {
                        type: "boolean",
                        description: "Whether to assign the user token.",
                      },
                    };
                  } else {
                    console.log(
                      `Preserving existing schema for ${pathKey}(${method})`
                    );
                    properties = param.schema.properties;
                  }
                } else if (operation.tags?.includes("Tables")) {
                  properties = { name: { type: "string" } };
                } else if (operation.tags?.includes("Fields")) {
                  properties =
                    method === "delete"
                      ? {
                          fieldIds: {
                            type: "array",
                            items: { type: "integer" },
                          },
                        }
                      : {
                          label: {
                            type: "string",
                            description: "The label of the field",
                          },
                          fieldType: {
                            type: "string",
                            description: "The type of the field",
                            enum: [
                              "text",
                              "text-multiple-choice",
                              "text-multi-line",
                              "rich-text",
                              "numeric",
                              "currency",
                              "percent",
                              "rating",
                              "date",
                              "date-time",
                              "time-of-day",
                              "duration",
                              "checkbox",
                              "user",
                              "multi-user",
                              "address",
                              "email",
                              "phone",
                              "url",
                              "file",
                              "record-id",
                            ],
                          },
                          fieldHelp: {
                            type: "string",
                            description: "Help text for the field",
                            nullable: true,
                          },
                          addToForms: {
                            type: "boolean",
                            description: "Whether to add the field to forms",
                            nullable: true,
                          },
                          permissions: {
                            anyOf: [
                              {
                                type: "array",
                                items: { $ref: "#/definitions/Permission" },
                              },
                              { type: "null" },
                            ],
                            description: "Custom permissions for the field",
                          },
                          required: {
                            type: "boolean",
                            description: "Whether the field is required",
                            nullable: true,
                          },
                          unique: {
                            type: "boolean",
                            description:
                              "Whether the field must have unique values",
                            nullable: true,
                          },
                          noWrap: {
                            type: "boolean",
                            description: "Whether text wrapping is disabled",
                            nullable: true,
                          },
                          bold: {
                            type: "boolean",
                            description: "Whether the field is bolded",
                            nullable: true,
                          },
                          appearsByDefault: {
                            type: "boolean",
                            description:
                              "Whether the field appears by default in reports",
                            nullable: true,
                          },
                          findEnabled: {
                            type: "boolean",
                            description: "Whether the field is searchable",
                            nullable: true,
                          },
                          doesDataCopy: {
                            type: "boolean",
                            description: "Whether the field copies data",
                            nullable: true,
                          },
                          audited: {
                            type: "boolean",
                            description:
                              "Whether changes to the field are audited",
                            nullable: true,
                          },
                        };
                } else if (operation.tags?.includes("Reports")) {
                  properties = {
                    filters: { type: "array", items: { type: "object" } },
                  };
                } else if (operation.tags?.includes("Auth")) {
                  properties = { token: { type: "string" } };
                } else if (operation.tags?.includes("UserToken")) {
                  properties = operation.summary
                    ?.toLowerCase()
                    .includes("transfer")
                    ? {
                        userToken: { type: "string" },
                        toUserId: { type: "string" },
                      }
                    : { userToken: { type: "string" } };
                } else if (operation.tags?.includes("Audit")) {
                  properties = {
                    events: { type: "array", items: { type: "object" } },
                  };
                } else if (operation.tags?.includes("Analytics")) {
                  properties = {
                    where: { type: "array", items: { type: "object" } },
                  };
                } else if (operation.tags?.includes("Solutions")) {
                  properties = { name: { type: "string" } };
                } else {
                  properties = {
                    items: { type: "array", items: { type: "string" } },
                  };
                }
                spec.definitions[requestName] = {
                  type: "object",
                  properties,
                  required: Object.keys(properties).filter(
                    (key) =>
                      key !== "fieldsToReturn" &&
                      key !== "description" &&
                      key !== "properties"
                  ),
                  description: operation.summary || `Request body for ${opId}`,
                };
              }
            }
            param.schema = { $ref: `#/definitions/${requestName}` };
            console.log(
              `Ensured ${requestName} in definitions for ${pathKey}(${method})`
            );
          } else if (
            !param.type &&
            !param.schema &&
            (param.in === "path" || param.in === "query")
          ) {
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
            const responseName = normalizeDefinitionName(
              `${opId}${cleanStatus}Response`
            );
            if (!spec.definitions[responseName]) {
              console.log(
                `Adding ${responseName} to definitions for ${pathKey}(${method})`
              );
              if (!response.schema.type && response["x-amf-mediaType"]) {
                const mediaType = response["x-amf-mediaType"];
                if (mediaType === "application/octet-stream") {
                  response.schema = {
                    type: "object",
                    properties: { data: { type: "string", format: "binary" } },
                    description:
                      response.schema?.description || "Binary file content",
                  };
                } else if (mediaType === "application/x-yaml") {
                  response.schema = {
                    type: "object",
                    properties: { content: { type: "string", format: "yaml" } },
                    description: "YAML-formatted data",
                  };
                } else if (
                  mediaType === "application/json" &&
                  response.schema.example
                ) {
                  response.schema = inferSchemaFromExample(
                    response.schema.example,
                    responseName
                  );
                  response.schema.description =
                    response.description || `Response for ${opId}`;
                }
              }
              spec.definitions[responseName] = response.schema;
            }
            response.schema = { $ref: `#/definitions/${responseName}` };
          }
        }
      }
    }
  }
}
