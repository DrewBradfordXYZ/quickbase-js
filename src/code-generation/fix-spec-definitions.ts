// src/code-generation/fix-spec-definitions.ts
export const definitions = {
  App: {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      created: { type: "string", format: "date-time" },
      updated: { type: "string", format: "date-time" },
      description: { type: "string" },
      timeZone: { type: "string" },
      dateFormat: { type: "string" },
      hasEveryoneOnTheInternet: { type: "boolean" },
      memoryInfo: { $ref: "#/definitions/AppMemoryInfo" },
      securityProperties: { $ref: "#/definitions/AppSecurityProperties" },
    },
  },
  AppMemoryInfo: {
    type: "object",
    properties: {
      estMemory: { type: "number" },
      estMemoryInclDependentApps: { type: "number" },
    },
  },
  AppSecurityProperties: {
    type: "object",
    properties: {
      allowClone: { type: "boolean" },
      allowExport: { type: "boolean" },
      enableAppTokens: { type: "boolean" },
      hideFromPublic: { type: "boolean" },
      mustBeRealmApproved: { type: "boolean" },
      useIPFilter: { type: "boolean" },
    },
  },
  CreateAppRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description:
          "The app name. Multiple apps with the same name are allowed in the same realm.",
      },
      assignToken: {
        type: "boolean",
        description:
          "Set to true to assign the app to the user token used to create it. Default is false.",
      },
      description: {
        type: "string",
        description:
          "The description for the app. Defaults to blank if omitted.",
      },
      securityProperties: {
        $ref: "#/definitions/AppSecurityProperties",
        description: "Application security properties.",
      },
      variables: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
          },
          required: ["name", "value"],
        },
        description:
          "App variables (max 10, optional). See About Application Variables.",
      },
    },
  },
  CreateApp200Response: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The unique identifier for this application.",
      },
      name: { type: "string", description: "The app name." },
      description: {
        type: "string",
        description: "The description for the app.",
      },
      created: {
        type: "string",
        format: "date-time",
        description: "The time and date the app was created (ISO 8601, UTC).",
      },
      updated: {
        type: "string",
        format: "date-time",
        description:
          "The time and date the app was last updated (ISO 8601, UTC).",
      },
      dateFormat: {
        type: "string",
        description:
          "The format used for displaying dates in the app (e.g., MM-DD-YYYY).",
      },
      timeZone: {
        type: "string",
        description:
          "The time zone used for displaying time values (e.g., (UTC-08:00) Pacific Time).",
      },
      memoryInfo: {
        $ref: "#/definitions/AppMemoryInfo",
        description: "Application memory information.",
      },
      hasEveryoneOnTheInternet: {
        type: "boolean",
        description:
          "Indicates if the app includes Everyone On The Internet access.",
      },
      variables: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
          },
          required: ["name", "value"],
        },
        description: "The app variables.",
      },
      dataClassification: {
        type: "string",
        description:
          "The Data Classification label assigned to the app (optional, may be 'None').",
      },
      securityProperties: {
        $ref: "#/definitions/AppSecurityProperties",
        description: "Security properties of the application.",
      },
    },
    required: ["id", "name"],
  },
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
      label: {
        type: "string",
        description: "The label (name) of the field.",
      },
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
      label: {
        type: "string",
        description: "The label (name) of the field.",
      },
      fieldType: {
        type: "string",
        description: "The type of field.",
      },
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
  Table: {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: {
        type: "string",
        description: "The unique identifier (dbid) of the table.",
      },
      name: { type: "string", description: "The name of the table." },
      alias: {
        type: "string",
        description: "The automatically-created table alias for the table.",
      },
      description: {
        type: "string",
        description:
          "The description of the table, as configured by an application administrator.",
      },
      created: {
        type: "string",
        format: "date-time",
        description:
          "The time and date when the table was created, in ISO 8601 format (UTC).",
      },
      updated: {
        type: "string",
        format: "date-time",
        description:
          "The time and date when the table schema or data was last updated, in ISO 8601 format (UTC).",
      },
      nextRecordId: {
        type: "integer",
        description:
          "The incremental Record ID that will be used when the next record is created.",
      },
      nextFieldId: {
        type: "integer",
        description:
          "The incremental Field ID that will be used when the next field is created.",
      },
      defaultSortFieldId: {
        type: "integer",
        description:
          "The id of the field that is configured for default sorting.",
      },
      defaultSortOrder: {
        type: "string",
        enum: ["ASC", "DESC"],
        description:
          "The default sort order for the table, either ascending (ASC) or descending (DESC).",
      },
      keyFieldId: {
        type: "integer",
        description:
          "The id of the field that is configured to be the key on this table, usually the Quickbase Record ID.",
      },
      singleRecordName: {
        type: "string",
        description: "The builder-configured singular noun of the table.",
      },
      pluralRecordName: {
        type: "string",
        description: "The builder-configured plural noun of the table.",
      },
      sizeLimit: {
        type: "string",
        description: "The size limit for the table (e.g., '150 MB').",
      },
      spaceUsed: {
        type: "string",
        description:
          "The amount of space currently being used by the table (e.g., '17 MB').",
      },
      spaceRemaining: {
        type: "string",
        description:
          "The amount of space remaining for use by the table (e.g., '133 MB').",
      },
    },
  },
  UpdateTableRequest: {
    type: "object",
    properties: {
      name: { type: "string", description: "The new name for the table." },
      singleRecordName: {
        type: "string",
        description:
          "The new singular noun for records in the table. Defaults to 'Record' if not provided.",
      },
      pluralRecordName: {
        type: "string",
        description:
          "The new plural noun for records in the table. Defaults to 'Records' if not provided.",
      },
      description: {
        type: "string",
        description:
          "The new description for the table. Defaults to blank if not provided.",
      },
    },
    description:
      "Request body for updating table properties. At least one property must be provided.",
  },
  DeleteTableResponse: {
    type: "object",
    properties: {
      deletedTableId: { type: "string", description: "The deleted table id." },
    },
  },
  Record: {
    type: "object",
    properties: {
      _dummy: {
        type: "string",
        description: "Unused dummy property to force model generation.",
        nullable: true,
      },
    },
    additionalProperties: {
      type: "object",
      properties: {
        value: {
          anyOf: [
            { type: "string" },
            { type: "number" },
            { type: "boolean" },
            { type: "object" },
            { type: "array" },
            { type: "null" },
          ],
          description: "The value of the field.",
        },
      },
      required: ["value"],
      description: "The value object for a field ID key.",
    },
    description:
      "A record with field ID keys (e.g., '6') and value objects (e.g., { value: 'data' }).",
  },
  UpsertRequest: {
    type: "object",
    required: ["to"],
    properties: {
      to: { type: "string", description: "The table identifier (dbid)." },
      data: {
        type: "array",
        items: { $ref: "#/definitions/Record" },
        description: "Array of records to upsert.",
      },
      mergeFieldId: {
        type: "integer",
        description: "The field ID to merge on (optional).",
      },
      fieldsToReturn: {
        type: "array",
        items: { type: "integer" },
        description: "Field IDs to return in the response (optional).",
      },
    },
  },
  Upsert200Response: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              value: {
                anyOf: [
                  { type: "string" },
                  { type: "number" },
                  { type: "boolean" },
                  { type: "object" },
                  { type: "array" },
                  { type: "null" },
                ],
                description: "The value of the field.",
              },
            },
            required: ["value"],
          },
        },
        description: "Array of upserted records with field IDs and values.",
      },
      metadata: {
        type: "object",
        properties: {
          createdRecordIds: {
            type: "array",
            items: { type: "integer" },
            description: "IDs of newly created records.",
          },
          updatedRecordIds: {
            type: "array",
            items: { type: "integer" },
            description: "IDs of updated records.",
          },
          unchangedRecordIds: {
            type: "array",
            items: { type: "integer" },
            description: "IDs of unchanged records.",
          },
          totalNumberOfRecordsProcessed: {
            type: "integer",
            description: "Total records processed.",
          },
        },
        required: ["totalNumberOfRecordsProcessed"],
      },
    },
  },
  Upsert207Response: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: {
              value: {
                anyOf: [
                  { type: "string" },
                  { type: "number" },
                  { type: "boolean" },
                  { type: "object" },
                  { type: "array" },
                  { type: "null" },
                ],
                description: "The value of the field.",
              },
            },
            required: ["value"],
          },
        },
        description: "Array of successfully upserted records (may be empty).",
      },
      metadata: {
        type: "object",
        properties: {
          createdRecordIds: { type: "array", items: { type: "integer" } },
          updatedRecordIds: { type: "array", items: { type: "integer" } },
          unchangedRecordIds: { type: "array", items: { type: "integer" } },
          lineErrors: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } },
            description: "Errors by line number (1-based index).",
          },
          totalNumberOfRecordsProcessed: { type: "integer" },
        },
        required: ["totalNumberOfRecordsProcessed"],
      },
    },
  },
  ReportRunResponse: {
    type: "object",
    properties: {
      id: { type: "string" },
      data: { type: "object" },
    },
  },
  GetTempTokenDBID200Response: {
    type: "object",
    required: ["temporaryAuthorization"],
    properties: {
      temporaryAuthorization: { type: "string" },
    },
  },
  DeleteRecordsRequest: {
    type: "object",
    required: ["from", "where"],
    properties: {
      from: {
        type: "string",
        description:
          "The table identifier (dbid) from which to delete records.",
      },
      where: {
        type: "string",
        description:
          "A QuickBase query string specifying which records to delete.",
      },
    },
    description:
      "Request body for deleting records from a table using a query.",
  },
  DeleteRecords200Response: {
    type: "object",
    properties: {
      numberDeleted: {
        type: "integer",
        description: "The number of records successfully deleted.",
      },
    },
    required: ["numberDeleted"],
    description: "Response body for successful deletion of records.",
  },
  RunQueryRequest: {
    type: "object",
    required: ["from"],
    properties: {
      from: { type: "string", description: "Table ID (dbid)" },
      select: {
        type: "array",
        items: { type: "integer" },
        description: "Field IDs to return",
      },
      where: { type: "string", description: "Query string" },
      sortBy: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fieldId: { type: "integer" },
            order: { type: "string", enum: ["ASC", "DESC"] },
          },
        },
        description: "Sort criteria",
      },
      groupBy: {
        type: "array",
        items: {
          type: "object",
          properties: {
            fieldId: { type: "integer" },
            grouping: { type: "string", enum: ["equal-values"] },
          },
        },
        description: "Grouping criteria",
      },
      options: {
        type: "object",
        properties: {
          skip: { type: "integer", description: "Number of records to skip" },
          top: {
            type: "integer",
            description: "Max number of records to return",
          },
          compareWithAppLocalTime: {
            type: "boolean",
            description: "Compare times with app local time",
          },
        },
      },
    },
  },
  RunQueryResponse: {
    type: "object",
    properties: {
      data: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: { value: { type: "any" } },
          },
        },
        description: "Array of record data with field IDs as keys",
      },
      fields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            label: { type: "string" },
            type: { type: "string" },
          },
        },
        description: "Field metadata",
      },
      metadata: {
        type: "object",
        properties: {
          numFields: { type: "integer" },
          numRecords: { type: "integer" },
          skip: { type: "integer" },
          top: { type: "integer" },
          totalRecords: { type: "integer" },
        },
        description: "Query metadata",
      },
    },
  },
  GetRelationships200Response: {
    type: "object",
    properties: {
      metadata: {
        type: "object",
        properties: {
          numRelationships: {
            type: "integer",
            description:
              "The number of relationships in the current response object.",
          },
          skip: {
            type: "integer",
            description: "The number of relationships skipped.",
          },
          totalRelationships: {
            type: "integer",
            description: "The total number of relationships.",
          },
        },
        required: ["numRelationships", "skip", "totalRelationships"],
        description:
          "Additional information about the results that may be helpful.",
      },
      relationships: {
        type: "array",
        items: { $ref: "#/definitions/Relationship" },
        description: "The relationships in a table.",
      },
    },
    required: ["metadata", "relationships"],
    description: "Response containing relationships for a table.",
  },
  Relationship: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        description: "The relationship id (foreign key field id).",
      },
      parentTableId: {
        type: "string",
        description: "The parent table id of the relationship.",
      },
      childTableId: {
        type: "string",
        description: "The child table id of the relationship.",
      },
      foreignKeyField: {
        $ref: "#/definitions/RelationshipField",
        description: "The foreign key field information.",
      },
      isCrossApp: {
        type: "boolean",
        description: "Whether this is a cross-app relationship.",
      },
      lookupFields: {
        type: "array",
        items: { $ref: "#/definitions/RelationshipField" },
        description: "The lookup fields array.",
      },
      summaryFields: {
        type: "array",
        items: { $ref: "#/definitions/RelationshipField" },
        description: "The summary fields array.",
      },
    },
    required: [
      "id",
      "parentTableId",
      "childTableId",
      "foreignKeyField",
      "isCrossApp",
    ],
    description: "A relationship between tables.",
  },
  RelationshipField: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        description: "Field id.",
      },
      label: {
        type: "string",
        description: "Field label.",
      },
      type: {
        type: "string",
        description: "Field type.",
      },
    },
    required: ["id", "label", "type"],
    description:
      "A field involved in a relationship (foreign key, lookup, or summary).",
  },
  CopyAppRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description: "The name of the newly copied app.",
      },
      description: {
        type: "string",
        description: "The description of the newly copied app.",
      },
      properties: {
        type: "object",
        properties: {
          keepData: {
            type: "boolean",
            description:
              "Whether to copy the app's data along with the schema.",
          },
          excludeFiles: {
            type: "boolean",
            description:
              "If keepData is true, whether to copy file attachments. Ignored if keepData is false.",
          },
          usersAndRoles: {
            type: "boolean",
            description:
              "If true, users will be copied along with their assigned roles. If false, users and roles will be copied but roles will not be assigned.",
          },
          assignUserToken: {
            type: "boolean",
            description:
              "Whether to add the user token used to make this request to the new app.",
          },
        },
        description:
          "The configuration properties for performing the app copy.",
      },
    },
    description: "Request body for copying an existing application.",
  },
  CopyApp200Response: {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: {
        type: "string",
        description: "The unique identifier for the copied application.",
      },
      name: {
        type: "string",
        description:
          "The app name. Multiple apps with the same name are allowed in the same realm.",
      },
      description: {
        type: "string",
        description: "The description for the app.",
      },
      created: {
        type: "string",
        format: "date-time",
        description: "The time and date the app was created (ISO 8601, UTC).",
      },
      updated: {
        type: "string",
        format: "date-time",
        description:
          "The time and date the app was last updated (ISO 8601, UTC).",
      },
      dateFormat: {
        type: "string",
        description:
          "The format used for displaying dates in the app (e.g., MM-DD-YYYY).",
      },
      timeZone: {
        type: "string",
        description:
          "The time zone used for displaying time values (e.g., (UTC-08:00) Pacific Time).",
      },
      hasEveryoneOnTheInternet: {
        type: "boolean",
        description:
          "Indicates if the app includes Everyone On The Internet access.",
      },
      variables: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
          },
          required: ["name", "value"],
        },
        description: "The app variables.",
      },
      ancestorId: {
        type: "string",
        description: "The id of the app from which this app was copied.",
      },
      dataClassification: {
        type: "string",
        description:
          "The Data Classification label assigned to the app (optional, may be 'None').",
      },
    },
    description: "Response body for successful app copy operation.",
  },
  DeleteAppRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description:
          "The name of the application to delete, required for confirmation.",
      },
    },
    description:
      "Request body for deleting an application, requiring the app name for confirmation.",
  },
  DeleteApp200Response: {
    type: "object",
    properties: {
      deletedAppId: {
        type: "string",
        description: "The ID of the deleted application.",
      },
    },
    required: ["deletedAppId"],
    description: "Response body for successful deletion of an application.",
  },
};
