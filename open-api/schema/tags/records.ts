// schema/tags/records.ts
import { Operation, Parameter, Spec } from "../../types/spec.ts";
import { normalizeDefinitionName } from "../../utils/naming.ts";

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
          if (method === "post") {
            properties = {
              data: { type: "array", items: { $ref: "#/definitions/Record" } },
              to: { type: "string" },
              fieldsToReturn: { type: "array", items: { type: "integer" } },
            };
          } else if (method === "delete") {
            properties = {
              from: { type: "string" },
              where: { type: "string" },
            };
          } else if (operation.summary?.toLowerCase().includes("query")) {
            properties = {
              from: { type: "string" },
              select: { type: "array", items: { type: "integer" } },
              where: { type: "string" },
            };
          }
          if (properties) {
            spec.definitions[requestName] = {
              type: "object",
              properties,
              required: Object.keys(properties).filter(
                (key) => key !== "fieldsToReturn"
              ),
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
