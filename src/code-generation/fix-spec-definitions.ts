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
      name: {
        type: "string",
        description: "The app name.",
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
      id: { type: "integer" },
      label: { type: "string" },
      fieldType: { type: "string" },
      noWrap: { type: "boolean" },
      bold: { type: "boolean" },
      required: { type: "boolean" },
      appearsByDefault: { type: "boolean" },
      findEnabled: { type: "boolean" },
      unique: { type: "boolean" },
      doesDataCopy: { type: "boolean" },
      fieldHelp: { type: "string" },
      audited: { type: "boolean" },
      properties: { $ref: "#/definitions/FieldProperties" },
      permissions: {
        type: "array",
        items: { $ref: "#/definitions/FieldPermissionsInner" },
      },
    },
  },
  FieldProperties: {
    type: "object",
    properties: {
      primaryKey: { type: "boolean" },
      foreignKey: { type: "boolean" },
      numLines: { type: "integer" },
      maxLength: { type: "integer" },
      appendOnly: { type: "boolean" },
      allowHTML: { type: "boolean" },
      allowMentions: { type: "boolean" },
      sortAsGiven: { type: "boolean" },
      carryChoices: { type: "boolean" },
      allowNewChoices: { type: "boolean" },
      formula: { type: "string" },
      defaultValue: { type: "string" },
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
  Table: {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      alias: { type: "string" },
      created: { type: "string", format: "date-time" },
      defaultSortFieldId: { type: "integer" },
      defaultSortOrder: { type: "string" },
      description: { type: "string" },
      keyFieldId: { type: "integer" },
      nextFieldId: { type: "integer" },
      nextRecordId: { type: "integer" },
      pluralRecordName: { type: "string" },
      singleRecordName: { type: "string" },
      sizeLimit: { type: "string" },
      spaceRemaining: { type: "string" },
      spaceUsed: { type: "string" },
      updated: { type: "string", format: "date-time" },
    },
  },
  Record: {
    type: "object",
    properties: {
      additionalProperties: {
        type: "object",
        properties: {
          value: { type: "any" },
        },
      },
    },
    description: "A record with field ID keys and value objects.",
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
              value: { type: "any" },
            },
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
              value: { type: "any" },
            },
          },
        },
        description: "Array of successfully upserted records (may be empty).",
      },
      metadata: {
        type: "object",
        properties: {
          createdRecordIds: {
            type: "array",
            items: { type: "integer" },
          },
          updatedRecordIds: {
            type: "array",
            items: { type: "integer" },
          },
          unchangedRecordIds: {
            type: "array",
            items: { type: "integer" },
          },
          lineErrors: {
            type: "object",
            additionalProperties: {
              type: "array",
              items: { type: "string" },
            },
            description: "Errors by line number (1-based index).",
          },
          totalNumberOfRecordsProcessed: {
            type: "integer",
          },
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
};
