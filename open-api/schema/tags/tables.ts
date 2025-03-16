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
          if (pathKey === "/tables" && method === "post") {
            // Create Table
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
            // Update Table
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
          } else if (
            pathKey === "/tables/{tableId}/relationship" &&
            method === "post"
          ) {
            // Create Relationship
            properties = {
              parentTableId: {
                type: "string",
                description: "The ID of the parent table.",
              },
              childTableId: {
                type: "string",
                description: "The ID of the child table.",
              },
              foreignKeyFieldId: {
                type: "integer",
                description: "The field ID to use as the foreign key.",
              },
            };
          } else if (
            pathKey === "/tables/{tableId}/relationship/{relationshipId}" &&
            method === "post"
          ) {
            // Update Relationship
            properties = {
              parentTableId: {
                type: "string",
                description: "The updated ID of the parent table.",
              },
              childTableId: {
                type: "string",
                description: "The updated ID of the child table.",
              },
              foreignKeyFieldId: {
                type: "integer",
                description: "The updated field ID to use as the foreign key.",
              },
            };
          }
          if (properties) {
            spec.definitions[requestName] = {
              type: "object",
              properties,
              required: pathKey.includes("relationship")
                ? ["parentTableId", "childTableId", "foreignKeyFieldId"]
                : ["name"],
              additionalProperties: true,
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
