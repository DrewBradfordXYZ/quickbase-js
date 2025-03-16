// open-api/enhancers/records.ts
import { Operation, Parameter, Spec } from "../fix-spec-types.ts";
import { normalizeDefinitionName } from "../fix-spec-utils.ts";

export function enhanceRecords(spec: Spec): void {
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation: Operation = spec.paths[pathKey][method];
      if (operation.tags?.includes("Records")) {
        const opId =
          operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
        const requestName = normalizeDefinitionName(`${opId}Request`);
        let properties;

        if (method === "post") {
          properties = {
            data: {
              type: "array",
              items: { $ref: "#/definitions/Record" },
              description: "Array of records to upsert",
            },
            to: { type: "string", description: "Target table ID" },
            fieldsToReturn: {
              type: "array",
              items: { type: "integer" },
              description: "Fields to return in response",
            },
          };
        } else if (method === "delete") {
          properties = {
            from: { type: "string", description: "Source table ID" },
            where: {
              type: "string",
              description: "Query condition for deletion",
            },
          };
        } else if (operation.summary?.toLowerCase().includes("query")) {
          properties = {
            from: { type: "string", description: "Source table ID" },
            select: {
              type: "array",
              items: { type: "integer" },
              description: "Fields to select",
            },
            where: { type: "string", description: "Query condition" },
          };
        } else {
          properties = { items: { type: "array", items: { type: "string" } } };
        }

        spec.definitions[requestName] = {
          type: "object",
          properties,
          required: Object.keys(properties).filter(
            (key) => key !== "fieldsToReturn"
          ),
          description:
            operation.summary || "Request body for records operation",
        };

        const bodyParam = operation.parameters.find((p) => p.in === "body");
        if (bodyParam) {
          bodyParam.schema = { $ref: `#/definitions/${requestName}` };
          console.log(
            `Enhanced Records schema for ${requestName} in ${pathKey}(${method})`
          );
        }
      }
    }
  }
}
