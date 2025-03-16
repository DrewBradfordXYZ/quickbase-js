// open-api/enhancers/common.ts
import { Operation, Parameter, Spec } from "../fix-spec-types.ts";

export function inferSchemaFromExample(
  example: any,
  operationId?: string
): any {
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

export function enhanceCommonDefinitions(spec: Spec): void {
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
}
