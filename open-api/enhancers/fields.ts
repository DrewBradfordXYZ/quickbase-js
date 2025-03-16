// open-api/enhancers/fields.ts
import { Operation, Parameter, Spec } from "../fix-spec-types.ts";
import { normalizeDefinitionName } from "../fix-spec-utils.ts";

export function enhanceFields(spec: Spec): void {
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation: Operation = spec.paths[pathKey][method];
      if (operation.tags?.includes("Fields")) {
        const opId =
          operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
        const requestName = normalizeDefinitionName(`${opId}Request`);

        let properties;
        if (method === "delete") {
          properties = {
            fieldIds: {
              type: "array",
              items: { type: "integer" },
              description: "Array of field IDs to delete",
            },
          };
        } else {
          properties = {
            label: { type: "string", description: "The label of the field" },
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
              type: "array",
              items: { $ref: "#/definitions/Permission" },
              description: "Custom permissions for the field",
              nullable: true,
            },
            required: {
              type: "boolean",
              description: "Whether the field is required",
              nullable: true,
            },
            unique: {
              type: "boolean",
              description: "Whether the field must have unique values",
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
              description: "Whether the field appears by default in reports",
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
              description: "Whether changes to the field are audited",
              nullable: true,
            },
          };
        }

        spec.definitions[requestName] = {
          type: "object",
          properties,
          required: method === "delete" ? ["fieldIds"] : ["label", "fieldType"],
          description:
            operation.summary ||
            (method === "delete"
              ? "Delete fields"
              : "Create or update a field"),
        };

        const bodyParam = operation.parameters.find((p) => p.in === "body");
        if (bodyParam) {
          bodyParam.schema = { $ref: `#/definitions/${requestName}` };
          console.log(
            `Enhanced Fields schema for ${requestName} in ${pathKey}(${method})`
          );
        }
      }
    }
  }
}
