export const definitions = {
  App: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      created: { type: "string", format: "date-time" },
      updated: { type: "string", format: "date-time" },
      description: { type: "string" },
      timeZone: { type: "string" },
      dateFormat: { type: "string" },
      hasEveryoneOnTheInternet: { type: "boolean" },
      memoryInfo: {
        type: "object",
        properties: {
          estMemory: { type: "number" },
          estMemoryInclDependentApps: { type: "number" },
        },
      },
      securityProperties: {
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
    },
    required: ["id", "name"],
  },
  Field: {
    type: "object",
    properties: {
      id: { type: "number" },
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
      properties: {
        type: "object",
        properties: {
          primaryKey: { type: "boolean" },
          foreignKey: { type: "boolean" },
          numLines: { type: "number" },
          maxLength: { type: "number" },
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
      permissions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            permissionType: { type: "string" },
            role: { type: "string" },
            roleId: { type: "number" },
          },
        },
      },
    },
    required: ["id", "label", "fieldType"],
  },
  Table: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      alias: { type: "string" },
      created: { type: "string", format: "date-time" },
      defaultSortFieldId: { type: "number" },
      defaultSortOrder: { type: "string" },
      description: { type: "string" },
      keyFieldId: { type: "number" },
      nextFieldId: { type: "number" },
      nextRecordId: { type: "number" },
      pluralRecordName: { type: "string" },
      singleRecordName: { type: "string" },
      sizeLimit: { type: "string" },
      spaceRemaining: { type: "string" },
      spaceUsed: { type: "string" },
      updated: { type: "string", format: "date-time" },
    },
    required: ["id", "name"],
  },
  Record: {
    type: "object",
    properties: {
      id: { type: "number" },
      fields: {
        type: "object",
        additionalProperties: { type: "string" },
      },
    },
    required: ["id"],
  },
  Upsert200Response: {
    type: "object",
    properties: {
      id: { type: "number" },
      status: { type: "string" },
    },
    required: ["id"],
  },
  ReportRunResponse: {
    type: "object",
    properties: {
      id: { type: "string" },
      data: { type: "object" }, // Placeholder
    },
    required: ["id"],
  },
};
