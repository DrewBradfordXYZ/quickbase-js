// utils/infer-schema.ts
export function inferSchema(example: any, operationId?: string): any {
  if (!example || typeof example !== "object") {
    return { type: "string" };
  }
  if (Array.isArray(example)) {
    return {
      type: "array",
      items:
        example.length > 0
          ? inferSchema(example[0], operationId)
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
            ? inferSchema(value[0], operationId)
            : { type: "string" },
      };
    } else if (typeof value === "object" && value !== null) {
      properties[key] = inferSchema(value, operationId);
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
