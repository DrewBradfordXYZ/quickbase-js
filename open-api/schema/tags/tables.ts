// schema/tags/tables.ts
import { Operation, Parameter, Spec } from "../../types/spec.ts";
import { normalizeDefinitionName } from "../../utils/naming.ts";

export function enhanceTables(
  spec: Spec,
  pathKey: string,
  method: string,
  operation: Operation
): void {
  const opId =
    operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
  if (operation.parameters && operation.tags?.includes("Tables")) {
    operation.parameters.forEach((param: Parameter) => {
      if (param.in === "body") {
        if (!param.schema) param.schema = {};
        let requestName =
          param.schema.$ref?.split("/").pop() || `${opId}Request`;
        requestName = normalizeDefinitionName(requestName);

        if (
          !spec.definitions[requestName] ||
          !spec.definitions[requestName].type ||
          Object.keys(spec.definitions[requestName]?.properties || {})
            .length === 0
        ) {
          console.log(
            `Defining schema for ${requestName} in ${pathKey}(${method})`
          );
          let properties;

          // Existing logic for other endpoints remains unchanged
          if (pathKey === "/tables" && method === "post") {
            properties = {
              name: {
                type: "string",
                description: "The name for the table.",
                minLength: 1,
              },
              description: {
                type: "string",
                description: "The description for the table...",
              },
              singleRecordName: {
                type: "string",
                description: "The singular noun for records...",
              },
              pluralRecordName: {
                type: "string",
                description: "The plural noun for records...",
              },
            };
          } else if (pathKey === "/tables/{tableId}" && method === "post") {
            properties = {
              name: {
                type: "string",
                description: "The updated name of the table.",
              },
              description: {
                type: "string",
                description: "The updated description for the table.",
              },
            };
          }
          // Add minimal fix for relationship endpoints
          else if (
            pathKey === "/tables/{tableId}/relationship" &&
            method === "post"
          ) {
            requestName = "CreateRelationshipRequest"; // Force correct name
            if (!spec.definitions[requestName]) {
              properties = {
                parentTableId: {
                  type: "string",
                  description: "The parent table id for the relationship.",
                },
                foreignKeyField: {
                  type: "object",
                  properties: {
                    label: {
                      type: "string",
                      description: "The label for the foreign key field.",
                    },
                  },
                  additionalProperties: true,
                },
                lookupFieldIds: {
                  type: "array",
                  items: { type: "integer" },
                  description: "Array of field ids...",
                },
                summaryFields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      summaryFid: {
                        type: "number",
                        description: "The field id to summarize.",
                      },
                      label: {
                        type: "string",
                        description: "The label for the summary field.",
                      },
                      accumulationType: {
                        type: "string",
                        enum: [
                          "AVG",
                          "SUM",
                          "MAX",
                          "MIN",
                          "STD-DEV",
                          "COUNT",
                          "COMBINED-TEXT",
                          "COMBINED-USER",
                          "DISTINCT-COUNT",
                        ],
                        description: "The accumulation type...",
                      },
                      where: { type: "string", description: "The filter..." },
                    },
                    required: ["accumulationType"],
                    additionalProperties: true,
                  },
                  description: "Array of summary field objects...",
                },
              };
            }
          } else if (
            pathKey === "/tables/{tableId}/relationship/{relationshipId}" &&
            method === "post"
          ) {
            requestName = "UpdateRelationshipRequest"; // Force correct name
            if (!spec.definitions[requestName]) {
              properties = {
                parentTableId: {
                  type: "string",
                  description: "The updated parent table id...",
                },
                foreignKeyField: {
                  type: "object",
                  properties: {
                    label: {
                      type: "string",
                      description: "The updated label...",
                    },
                  },
                  additionalProperties: true,
                },
                lookupFieldIds: {
                  type: "array",
                  items: { type: "integer" },
                  description: "Updated array of field ids...",
                },
                summaryFields: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      summaryFid: { type: "number" },
                      label: { type: "string" },
                      accumulationType: {
                        type: "string",
                        enum: [
                          "AVG",
                          "SUM",
                          "MAX",
                          "MIN",
                          "STD-DEV",
                          "COUNT",
                          "COMBINED-TEXT",
                          "COMBINED-USER",
                          "DISTINCT-COUNT",
                        ],
                      },
                      where: { type: "string" },
                    },
                    required: ["accumulationType"],
                    additionalProperties: true,
                  },
                },
              };
            }
          }

          if (properties) {
            spec.definitions[requestName] = {
              type: "object",
              properties,
              required:
                pathKey.includes("relationship") &&
                pathKey.endsWith("/relationship")
                  ? ["parentTableId"]
                  : pathKey === "/tables"
                  ? ["name"]
                  : [],
              additionalProperties: pathKey.includes("relationship")
                ? false
                : true, // Match raw spec
              description: operation.summary || `Request body for ${opId}`,
            };
          }
        }
        param.schema = { $ref: `#/definitions/${requestName}` };
        console.log(
          `Ensured ${requestName} in definitions for ${pathKey}(${method})`
        );
      }
    });
  }
}
