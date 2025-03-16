// schema/tags/fields.ts
import { Operation, Parameter, Spec } from "../../types/spec.ts";
import { normalizeDefinitionName } from "../../utils/naming.ts";

export function enhanceFields(
  spec: Spec,
  pathKey: string,
  method: string,
  operation: Operation
): void {
  const opId =
    operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
  if (operation.parameters && operation.tags?.includes("Fields")) {
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
          if (method === "delete") {
            properties = {
              fieldIds: { type: "array", items: { type: "integer" } },
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
            required: Object.keys(properties).filter(
              (key) =>
                ![
                  "fieldHelp",
                  "addToForms",
                  "permissions",
                  "required",
                  "unique",
                  "noWrap",
                  "bold",
                  "appearsByDefault",
                  "findEnabled",
                  "doesDataCopy",
                  "audited",
                ].includes(key)
            ),
            description: operation.summary || `Request body for ${opId}`,
          };
        }
        param.schema = { $ref: `#/definitions/${requestName}` };
        console.log(
          `Ensured ${requestName} in definitions for ${pathKey}(${method})`
        );
      }
    });
  }
}
