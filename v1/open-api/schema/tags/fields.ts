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
          let requiredFields: string[];

          if (method === "delete") {
            // DELETE /fields (deleteFields)
            properties = {
              fieldIds: { type: "array", items: { type: "integer" } },
            };
            requiredFields = ["fieldIds"];
          } else {
            // Common properties for createField and updateField
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
              properties: {
                type: "object",
                description: "Specific field properties",
                properties: {
                  numLines: {
                    type: "integer",
                    description:
                      "The number of lines shown in QuickBase for this text field",
                  },
                  maxLength: {
                    type: "integer",
                    description:
                      "The maximum number of characters allowed for entry",
                  },
                  appendOnly: {
                    type: "boolean",
                    description: "Whether this field is append-only",
                  },
                  sortAsGiven: {
                    type: "boolean",
                    description:
                      "Indicates if the listed entries sort as entered vs alphabetically",
                  },
                  allowMentions: {
                    type: "boolean",
                    description:
                      "If someone can @mention users in the rich text field",
                  },
                  comments: {
                    type: "string",
                    description:
                      "The comments entered on the field properties by an administrator",
                  },
                  doesTotal: {
                    type: "boolean",
                    description:
                      "Whether this field totals in reports within the product",
                  },
                  autoSave: {
                    type: "boolean",
                    description: "Whether the link field will auto save",
                  },
                  defaultValueLuid: {
                    type: "integer",
                    description: "Default user id value",
                  },
                  useI18NFormat: {
                    type: "boolean",
                    description:
                      "Whether phone numbers should be in E.164 standard international format",
                  },
                  maxVersions: {
                    type: "integer",
                    description:
                      "The maximum number of versions configured for a file attachment",
                  },
                  format: {
                    type: "integer",
                    description: "The format to display time",
                  },
                  carryChoices: {
                    type: "boolean",
                    description:
                      "Whether the field should carry its multiple choice fields when copied",
                  },
                  linkText: {
                    type: "string",
                    description:
                      "The configured text value that replaces the URL users see",
                  },
                  parentFieldId: {
                    type: "integer",
                    description:
                      "The id of the parent composite field, when applicable",
                  },
                  displayTimezone: {
                    type: "boolean",
                    description:
                      "Indicates whether to display the timezone within the product",
                  },
                  summaryTargetFieldId: {
                    type: "integer",
                    description:
                      "The id of the field used to aggregate values from the child",
                  },
                  allowNewChoices: {
                    type: "boolean",
                    description:
                      "Indicates if users can add new choices to a selection list",
                  },
                  defaultToday: {
                    type: "boolean",
                    description:
                      "Indicates if the field value is defaulted today for new records",
                  },
                  units: {
                    type: "string",
                    description: "The units label",
                  },
                  openTargetIn: {
                    type: "string",
                    enum: ["sameWindow", "newWindow", "popup"],
                    description:
                      "Indicates which target the URL should open in when clicked",
                  },
                  lookupTargetFieldId: {
                    type: "integer",
                    description:
                      "The id of the field that is the target on the parent table for this lookup",
                  },
                  summaryFunction: {
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
                    description: "The accumulation type for the summary field",
                  },
                  sourceFieldId: {
                    type: "integer",
                    description: "The id of the source field",
                  },
                  doesAverage: {
                    type: "boolean",
                    description:
                      "Whether this field averages in reports within the product",
                  },
                  formula: {
                    type: "string",
                    description:
                      "The formula of the field as configured in QuickBase",
                  },
                  decimalPlaces: {
                    type: "integer",
                    description:
                      "The number of decimal places displayed in the product",
                  },
                  defaultCountryCode: {
                    type: "string",
                    description:
                      "Controls the default country shown on international phone widgets",
                  },
                  displayMonth: {
                    type: "string",
                    description: "How to display months",
                  },
                  seeVersions: {
                    type: "boolean",
                    description:
                      "Indicates if users can see other versions of a file attachment",
                  },
                  defaultKind: {
                    type: "string",
                    description: "The user default type",
                  },
                  displayEmail: {
                    type: "string",
                    description: "How the email is displayed",
                  },
                  coverText: {
                    type: "string",
                    description:
                      "Alternate user-friendly text for displaying a link",
                  },
                  currencySymbol: {
                    type: "string",
                    description:
                      "The currency symbol used when displaying field values",
                  },
                  summaryQuery: {
                    type: "string",
                    description: "The summary query",
                  },
                  targetFieldId: {
                    type: "integer",
                    description: "The id of the target field",
                  },
                  displayUser: {
                    type: "string",
                    description: "The configured option for how users display",
                  },
                  blankIsZero: {
                    type: "boolean",
                    description:
                      "Whether a blank value is treated as 0 in calculations",
                  },
                  exact: {
                    type: "boolean",
                    description:
                      "Whether an exact match is required for a report link",
                  },
                  defaultDomain: {
                    type: "string",
                    description: "Default email domain",
                  },
                  defaultValue: {
                    type: "string",
                    description: "The default value configured for a field",
                  },
                  abbreviate: {
                    type: "boolean",
                    description:
                      "Don't show the URL protocol when showing the URL",
                  },
                  numberFormat: {
                    type: "integer",
                    description:
                      "The format used for displaying numeric values",
                  },
                  targetTableName: {
                    type: "string",
                    description: "The field's target table name",
                  },
                  appearsAs: {
                    type: "string",
                    description:
                      "The link text; if empty, the URL will be used",
                  },
                  width: {
                    type: "integer",
                    description: "The field's HTML input width in the product",
                  },
                  currencyFormat: {
                    type: "string",
                    enum: ["left", "right", "middle"],
                    description:
                      "The currency format used when displaying field values",
                  },
                  displayDayOfWeek: {
                    type: "boolean",
                    description:
                      "Indicates whether to display the day of the week",
                  },
                  summaryReferenceFieldId: {
                    type: "integer",
                    description:
                      "The id of the field that is the reference in the relationship",
                  },
                  commaStart: {
                    type: "integer",
                    description: "The number of digits before commas display",
                  },
                  choices: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "An array of entries that exist for a field offering choices",
                  },
                  targetTableId: {
                    type: "string",
                    description: "The id of the target table",
                  },
                  displayRelative: {
                    type: "boolean",
                    description: "Whether to display time as relative",
                  },
                  compositeFields: {
                    type: "array",
                    items: { type: "object", additionalProperties: true },
                    description:
                      "An array of fields that make up a composite field (e.g., address)",
                  },
                  displayCheckboxAsText: {
                    type: "boolean",
                    description:
                      "Indicates whether checkbox values are shown as text in reports",
                  },
                  versionMode: {
                    type: "string",
                    enum: ["keepallversions", "keeplastversions"],
                    description: "Version modes for files",
                  },
                  snapFieldId: {
                    type: "integer",
                    description: "The id of the field used to snapshot values",
                  },
                  hours24: {
                    type: "boolean",
                    description:
                      "Indicates whether to display time in 24-hour format",
                  },
                  sortAlpha: {
                    type: "boolean",
                    description:
                      "Whether to sort alphabetically (default is by record ID)",
                  },
                  hasExtension: {
                    type: "boolean",
                    description: "Whether this field has a phone extension",
                  },
                  useNewWindow: {
                    type: "boolean",
                    description:
                      "Indicates if the file should open a new window when clicked",
                  },
                  displayAsLink: {
                    type: "boolean",
                    description:
                      "Indicates if the field should be shown as a hyperlink",
                  },
                  lookupReferenceFieldId: {
                    type: "integer",
                    description:
                      "The id of the field that is the reference for this lookup",
                  },
                },
                nullable: true,
              },
            };

            // Adjust required fields based on operation
            if (pathKey.includes("{fieldId}") && method === "post") {
              // UpdateField (POST /fields/{fieldId})
              requiredFields = ["label"]; // fieldType is not allowed in updates
            } else {
              // CreateField (POST /fields)
              requiredFields = ["label", "fieldType"];
            }
          }

          spec.definitions[requestName] = {
            type: "object",
            properties,
            required: requiredFields,
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
