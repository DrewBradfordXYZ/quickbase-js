// open-api/schema/tags/records.ts
import { Operation, Parameter, Spec } from "../../types/spec.ts";
import { normalizeDefinitionName } from "../../utils/naming.ts"; // Ensure this import is present

export function enhanceRecords(
  spec: Spec,
  pathKey: string,
  method: string,
  operation: Operation
): void {
  const opId =
    operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
  if (operation.parameters && operation.tags?.includes("Records")) {
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
          // Upsert endpoint (/records)
          if (pathKey === "/records" && method === "post") {
            properties = {
              data: { type: "array", items: { $ref: "#/definitions/Record" } },
              to: { type: "string" },
              fieldsToReturn: { type: "array", items: { type: "integer" } },
            };
          }
          // Query endpoint (/records/query)
          else if (pathKey === "/records/query" && method === "post") {
            properties = {
              from: { type: "string", description: "The table identifier." },
              select: {
                type: "array",
                items: { type: "integer" },
                description: "An array of field ids...",
              },
              where: {
                type: "string",
                description:
                  "The filter, using the Quickbase query language...",
              },
              sortBy: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    fieldId: { type: "integer" },
                    order: {
                      type: "string",
                      enum: ["ASC", "DESC", "equal-values"],
                    },
                  },
                  required: ["fieldId", "order"],
                },
                description: "An array of field IDs and sort directions...",
              },
              groupBy: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    fieldId: { type: "integer" },
                    grouping: { type: "string", enum: ["equal-values"] },
                  },
                  required: ["fieldId", "grouping"],
                },
                description:
                  "An array that contains the fields to group the records by.",
              },
              options: {
                type: "object",
                properties: {
                  skip: { type: "integer" },
                  top: { type: "integer" },
                  compareWithAppLocalTime: { type: "boolean" },
                },
                description: "Additional query options.",
              },
            };
          }
          // Delete endpoint (/records)
          else if (method === "delete") {
            properties = {
              from: { type: "string" },
              where: { type: "string" },
            };
          }
          if (properties) {
            spec.definitions[requestName] = {
              type: "object",
              properties,
              required: ["from"], // Only 'from' is required per the spec
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
