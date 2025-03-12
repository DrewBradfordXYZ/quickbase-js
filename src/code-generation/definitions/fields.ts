// src/code-generation/definitions/fields.ts
export const fieldsDefinitions = {
  Field: {
    type: "object",
    required: ["id", "label", "fieldType"],
    properties: {
      id: {
        type: "integer",
        description: "The id of the field, unique to this table.",
      },
      label: { type: "string", description: "The label (name) of the field." },
      fieldType: { type: "string", description: "The type of field." },
      mode: {
        type: "string",
        description:
          "For derived fields, this will be 'lookup', 'summary', or 'formula'. For non-derived fields, this will be blank.",
      },
      noWrap: {
        type: "boolean",
        description:
          "Indicates if the field is configured to not wrap when displayed in the product.",
      },
      bold: {
        type: "boolean",
        description:
          "Indicates if the field is configured to display in bold in the product.",
      },
      required: {
        type: "boolean",
        description: "Indicates if the field is marked required.",
      },
      appearsByDefault: {
        type: "boolean",
        description:
          "Indicates if the field is marked as a default in reports.",
      },
      findEnabled: {
        type: "boolean",
        description: "Indicates if the field is marked as searchable.",
      },
      unique: {
        type: "boolean",
        description: "Indicates if the field is marked unique.",
      },
      doesDataCopy: {
        type: "boolean",
        description:
          "Indicates if the field data will copy when a user copies the record.",
      },
      fieldHelp: {
        type: "string",
        description:
          "The configured help text shown to users within the product.",
      },
      audited: {
        type: "boolean",
        description:
          "Indicates if the field is being tracked as part of Quickbase Audit Logs.",
      },
      properties: {
        $ref: "#/definitions/FieldProperties",
        description: "Additional properties for the field.",
      },
      permissions: {
        type: "array",
        items: { $ref: "#/definitions/FieldPermissionsInner" },
        description: "Field permissions for different roles.",
      },
    },
  },
  FieldProperties: {
    type: "object",
    properties: {
      primaryKey: { type: "boolean" },
      foreignKey: {
        type: "boolean",
        description:
          "Indicates if the field is a foreign key (or reference field) in a relationship.",
      },
      numLines: {
        type: "integer",
        description:
          "The number of lines shown in Quickbase for this text field.",
      },
      maxLength: {
        type: "integer",
        description:
          "The maximum number of characters allowed for entry in Quickbase for this field.",
      },
      appendOnly: {
        type: "boolean",
        description: "Whether this field is append only.",
      },
      allowHTML: {
        type: "boolean",
        description: "Whether this field allows html.",
      },
      allowMentions: {
        type: "boolean",
        description:
          "If someone can @mention users in the rich text field to generate an email notification.",
      },
      sortAsGiven: {
        type: "boolean",
        description:
          "Indicates if the listed entries sort as entered vs alphabetically.",
      },
      carryChoices: {
        type: "boolean",
        description:
          "Whether the field should carry its multiple choice fields when copied.",
      },
      allowNewChoices: {
        type: "boolean",
        description:
          "Indicates if users can add new choices to a selection list.",
      },
      formula: {
        type: "string",
        description: "The formula of the field as configured in Quickbase.",
      },
      defaultValue: {
        type: "string",
        description:
          "The default value configured for a field when a new record is added.",
      },
      doesTotal: {
        type: "boolean",
        description: "Whether this field totals in reports within the product.",
      },
      autoSave: {
        type: "boolean",
        description: "Whether the link field will auto save.",
      },
      defaultValueLuid: {
        type: "integer",
        description: "Default user id value.",
      },
      useI18NFormat: {
        type: "boolean",
        description:
          "Whether phone numbers should be in E.164 standard international format.",
      },
      maxVersions: {
        type: "integer",
        description:
          "The maximum number of versions configured for a file attachment.",
      },
      format: { type: "integer", description: "The format to display time." },
      linkText: {
        type: "string",
        description:
          "The configured text value that replaces the URL that users see within the product.",
      },
      parentFieldId: {
        type: "integer",
        description: "The id of the parent composite field, when applicable.",
      },
      displayTimezone: {
        type: "boolean",
        description:
          "Indicates whether to display the timezone within the product.",
      },
      defaultToday: {
        type: "boolean",
        description:
          "Indicates if the field value is defaulted today for new records.",
      },
      units: { type: "string", description: "The units label." },
      openTargetIn: {
        type: "string",
        enum: ["sameWindow", "newWindow", "popup"],
        description:
          "Indicates which target the URL should open in when a user clicks it within the product.",
      },
      doesAverage: {
        type: "boolean",
        description:
          "Whether this field averages in reports within the product.",
      },
      decimalPlaces: {
        type: "integer",
        description:
          "The number of decimal places displayed in the product for this field.",
      },
      defaultCountryCode: {
        type: "string",
        description:
          "Controls the default country shown on international phone widgets on forms. Country code should be entered in the ISO 3166-1 alpha-2 format.",
      },
      seeVersions: {
        type: "boolean",
        description:
          "Indicates if the user can see other versions, aside from the most recent, of a file attachment within the product.",
      },
      displayMonth: { type: "string", description: "How to display months." },
      displayEmail: {
        type: "string",
        description: "How the email is displayed.",
      },
      defaultKind: { type: "string", description: "The user default type." },
      coverText: {
        type: "string",
        description:
          "An alternate user friendly text that can be used to display a link in the browser.",
      },
      currencySymbol: {
        type: "string",
        description:
          "The current symbol used when displaying field values within the product.",
      },
      targetFieldId: {
        type: "integer",
        description: "The id of the target field.",
      },
      displayUser: {
        type: "string",
        description:
          "The configured option for how users display within the product.",
      },
      blankIsZero: {
        type: "boolean",
        description:
          "Whether a blank value is treated the same as 0 in calculations within the product.",
      },
      exact: {
        type: "boolean",
        description: "Whether an exact match is required for a report link.",
      },
      defaultDomain: { type: "string", description: "Default email domain." },
      abbreviate: {
        type: "boolean",
        description: "Don't show the URL protocol when showing the URL.",
      },
      numberFormat: {
        type: "integer",
        description:
          "The format used for displaying numeric values in the product (decimal, separators, digit group).",
      },
      targetTableName: {
        type: "string",
        description: "The field's target table name.",
      },
      appearsAs: {
        type: "string",
        description:
          "The link text, if empty, the url will be used as link text.",
      },
      width: {
        type: "integer",
        description: "The field's html input width in the product.",
      },
      currencyFormat: {
        type: "string",
        enum: ["left", "right", "middle"],
        description:
          "The currency format used when displaying field values within the product.",
      },
      displayDayOfWeek: {
        type: "boolean",
        description:
          "Indicates whether to display the day of the week within the product.",
      },
      commaStart: {
        type: "integer",
        description:
          "The number of digits before commas display in the product, when applicable.",
      },
      choices: {
        type: "array",
        items: { type: "string" },
        description:
          "An array of entries that exist for a field that offers choices to the user.",
      },
      targetTableId: {
        type: "string",
        description: "The id of the target table.",
      },
      displayRelative: {
        type: "boolean",
        description: "Whether to display time as relative.",
      },
      compositeFields: {
        type: "array",
        items: { type: "object" }, // Simplified; could reference Field if recursive
        description:
          "An array of the fields that make up a composite field (e.g., address).",
      },
      displayCheckboxAsText: {
        type: "boolean",
        description:
          "Indicates whether the checkbox values will be shown as text in reports.",
      },
      displayTime: {
        type: "boolean",
        description:
          "Indicates whether to display the time, in addition to the date.",
      },
      versionMode: {
        type: "string",
        enum: ["keepallversions", "keeplastversions"],
        description:
          "Version modes for files. Keep all versions vs keep last version.",
      },
      snapFieldId: {
        type: "integer",
        description:
          "The id of the field that is used to snapshot values from, when applicable.",
      },
      hours24: {
        type: "boolean",
        description:
          "Indicates whether or not to display time in the 24-hour format within the product.",
      },
      sortAlpha: {
        type: "boolean",
        description:
          "Whether to sort alphabetically, default sort is by record ID.",
      },
      hasExtension: {
        type: "boolean",
        description: "Whether this field has a phone extension.",
      },
      useNewWindow: {
        type: "boolean",
        description:
          "Indicates if the URL should open a new window when a user clicks it within the product.",
      },
      displayAsLink: {
        type: "boolean",
        description:
          "Indicates if a field that is part of the relationship should be shown as a hyperlink to the parent record within the product.",
      },
      lookupReferenceFieldId: {
        type: "integer",
        description:
          "The id of the field that is the reference in the relationship for this lookup.",
      },
      summaryTargetFieldId: {
        type: "integer",
        description:
          "The id of the field that is used to aggregate values from the child, when applicable.",
      },
      masterChoiceFieldId: {
        type: "integer",
        description:
          "The id of the field that is the reference in the relationship.",
      },
      lookupTargetFieldId: {
        type: "integer",
        description:
          "The id of the field that is the target on the master table for this lookup.",
      },
      masterChoiceTableId: {
        type: "string",
        description:
          "The id of the table that is the master in this relationship.",
      },
      summaryReferenceFieldId: {
        type: "integer",
        description:
          "The id of the field that is the reference in the relationship for this summary.",
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
        description: "The summary accumulation function type.",
      },
      masterTableTag: {
        type: "string",
        description:
          "The table alias for the master table in the relationship this field is part of.",
      },
      choicesLuid: {
        type: "array",
        items: { type: "integer" },
        description: "List of user choices.",
      },
      xmlTag: { type: "string", description: "The field's xml tag." },
      startField: { type: "integer", description: "The start field id." },
      durationField: { type: "integer", description: "The duration field id." },
      workWeek: { type: "integer", description: "The work week type." },
    },
  },
  FieldPermissionsInner: {
    type: "object",
    properties: {
      permissionType: { type: "string" },
      role: { type: "string" },
      roleId: { type: "integer" },
    },
  },
  CreateFieldRequest: {
    type: "object",
    required: ["label", "fieldType"],
    properties: {
      label: { type: "string", description: "The label (name) of the field." },
      fieldType: {
        type: "string",
        enum: [
          "text",
          "text-multiple-choice",
          "text-multi-line",
          "rich-text",
          "numeric",
          "currency",
          "rating",
          "percent",
          "multitext",
          "email",
          "url",
          "duration",
          "date",
          "datetime",
          "timestamp",
          "timeofday",
          "checkbox",
          "user",
          "multiuser",
          "address",
          "phone",
          "file",
        ],
        description: "The type of field. See field type details for more info.",
      },
      noWrap: {
        type: "boolean",
        description:
          "Indicates if the field is configured to not wrap when displayed in the product. Defaults to false.",
        default: false,
      },
      bold: {
        type: "boolean",
        description:
          "Indicates if the field is configured to display in bold in the product. Defaults to false.",
        default: false,
      },
      appearsByDefault: {
        type: "boolean",
        description:
          "Indicates if the field is marked as a default in reports. Defaults to true.",
        default: true,
      },
      findEnabled: {
        type: "boolean",
        description:
          "Indicates if the field is marked as searchable. Defaults to true.",
        default: true,
      },
      fieldHelp: {
        type: "string",
        description:
          "The configured help text shown to users within the product.",
      },
      addToForms: {
        type: "boolean",
        description:
          "Whether the field should appear on forms. Defaults to false.",
        default: false,
      },
      audited: {
        type: "boolean",
        description:
          "Indicates if the field is being tracked as part of Quickbase Audit Logs. Defaults to false.",
        default: false,
      },
      properties: {
        $ref: "#/definitions/FieldProperties",
        description: "Specific field properties.",
      },
      permissions: {
        type: "array",
        items: { $ref: "#/definitions/FieldPermissionsInner" },
        description: "Field permissions for different roles.",
      },
    },
    description: "Request body for creating a new field in a table.",
  },
  CreateField200Response: {
    type: "object",
    required: ["id", "label", "fieldType"],
    properties: {
      id: {
        type: "integer",
        description: "The id of the field, unique to this table.",
      },
      label: { type: "string", description: "The label (name) of the field." },
      fieldType: { type: "string", description: "The type of field." },
      mode: {
        type: "string",
        description:
          "For derived fields, this will be 'lookup', 'summary', or 'formula'. For non-derived fields, this will be blank.",
      },
      noWrap: {
        type: "boolean",
        description:
          "Indicates if the field is configured to not wrap when displayed in the product.",
      },
      bold: {
        type: "boolean",
        description:
          "Indicates if the field is configured to display in bold in the product.",
      },
      required: {
        type: "boolean",
        description: "Indicates if the field is marked required.",
      },
      appearsByDefault: {
        type: "boolean",
        description:
          "Indicates if the field is marked as a default in reports.",
      },
      findEnabled: {
        type: "boolean",
        description: "Indicates if the field is marked as searchable.",
      },
      unique: {
        type: "boolean",
        description: "Indicates if the field is marked unique.",
      },
      doesDataCopy: {
        type: "boolean",
        description:
          "Indicates if the field data will copy when a user copies the record.",
      },
      fieldHelp: {
        type: "string",
        description:
          "The configured help text shown to users within the product.",
      },
      audited: {
        type: "boolean",
        description:
          "Indicates if the field is being tracked as part of Quickbase Audit Logs.",
      },
      properties: {
        $ref: "#/definitions/FieldProperties",
        description: "Additional properties for the field.",
      },
      permissions: {
        type: "array",
        items: { $ref: "#/definitions/FieldPermissionsInner" },
        description: "Field permissions for different roles.",
      },
    },
    description: "Response body for successful field creation.",
  },
  DeleteFieldsRequest: {
    type: "object",
    required: ["fieldIds"],
    properties: {
      fieldIds: {
        type: "array",
        items: { type: "integer" },
        description: "List of field ids to be deleted.",
      },
    },
    description: "Request body for deleting fields from a table.",
  },
  DeleteFields200Response: {
    type: "object",
    properties: {
      deletedFieldIds: {
        type: "array",
        items: { type: "integer" },
        description: "List of field ids that were deleted.",
      },
      errors: {
        type: "array",
        items: { type: "string" },
        description: "List of errors found during the deletion process.",
      },
    },
    description:
      "Response body for successful field deletion, with possible errors.",
  },
};
