// schema/tags/index.ts
import { Operation, Parameter, Spec } from "../../types/spec.ts";
import { normalizeDefinitionName } from "../../utils/naming.ts";
import { enhanceUsers } from "./users.ts";
import { enhanceGroups } from "./groups.ts";
import { enhanceRecords } from "./records.ts";
import { enhanceApps } from "./apps.ts";
import { enhanceFields } from "./fields.ts";
import { enhanceTables } from "./tables.ts";

export function enhanceTags(spec: Spec): void {
  spec.definitions = spec.definitions || {};

  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation: Operation = spec.paths[pathKey][method];
      const opId =
        operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;

      // Handle array schemas
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
              param.schema = { $ref: `#/definitions/${requestName}` };
              console.log(
                `Ensured ${requestName} in definitions for ${pathKey}(${method})`
              );
            }
          }
        });
      }

      // Apply tag-specific enhancements
      enhanceUsers(spec, pathKey, method, operation);
      enhanceGroups(spec, pathKey, method, operation);
      enhanceRecords(spec, pathKey, method, operation);
      enhanceApps(spec, pathKey, method, operation);
      enhanceFields(spec, pathKey, method, operation);
      enhanceTables(spec, pathKey, method, operation);
    }
  }
}
