export const definitions = {
  Field: {
    type: "object",
    properties: {
      id: { type: "integer" },
      label: { type: "string" },
      fieldType: { type: "string" },
      appearsByDefault: { type: "boolean" },
      audited: { type: "boolean" },
      bold: { type: "boolean" },
      doesDataCopy: { type: "boolean" },
      fieldHelp: { type: "string" },
      findEnabled: { type: "boolean" },
      mode: { type: "string" },
      noWrap: { type: "boolean" },
      required: { type: "boolean" },
      unique: { type: "boolean" },
      addToForms: { type: "boolean" },
      permissions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            permissionType: { type: "string" },
            role: { type: "string" },
            roleId: { type: "integer" },
          },
          required: ["permissionType", "role", "roleId"],
        },
      },
      properties: {
        type: "object",
        properties: {
          primaryKey: { type: "boolean" },
          foreignKey: { type: "boolean" },
          formula: { type: "string" },
          defaultValue: { type: "string" },
          carryChoices: { type: "boolean" },
          allowNewChoices: { type: "boolean" },
          sortAsGiven: { type: "boolean" },
          numLines: { type: "integer" },
          maxLength: { type: "integer" },
          appendOnly: { type: "boolean" },
          allowHTML: { type: "boolean" },
          allowMentions: { type: "boolean" },
          numberFormat: { type: "integer" },
          decimalPlaces: { type: "integer" },
          doesAverage: { type: "boolean" },
          doesTotal: { type: "boolean" },
          blankIsZero: { type: "boolean" },
          commaStart: { type: "integer" },
          defaultToday: { type: "boolean" },
          displayDayOfWeek: { type: "boolean" },
          displayMonth: { type: "string" },
          displayRelative: { type: "boolean" },
          displayTime: { type: "boolean" },
          displayTimezone: { type: "boolean" },
          defaultKind: { type: "string" },
          displayUser: { type: "string" },
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
      defaultSortFieldId: { type: "integer" },
      defaultSortOrder: { type: "string" }, // e.g., "DESC", "ASC"
      description: { type: "string" },
      keyFieldId: { type: "integer" },
      nextFieldId: { type: "integer" },
      nextRecordId: { type: "integer" },
      pluralRecordName: { type: "string" },
      singleRecordName: { type: "string" },
      sizeLimit: { type: "string" }, // e.g., "500 MB"
      spaceRemaining: { type: "string" }, // e.g., "500 MB"
      spaceUsed: { type: "string" }, // e.g., "0 KB"
      updated: { type: "string", format: "date-time" },
    },
    required: ["id", "name"],
  },
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
  Record: { type: "object", additionalProperties: true },
  CreateField200Response: {
    type: "object",
    properties: { id: { type: "integer" } },
  },
  DeleteFields200Response: {
    type: "object",
    properties: { deleted: { type: "boolean" } },
  },
  Upsert200Response: {
    type: "object",
    properties: { metadata: { type: "object" } },
  },
  CopyAppRequest: {
    type: "object",
    properties: { name: { type: "string" } },
  },
  CopyApp200Response: {
    type: "object",
    properties: { id: { type: "string" } },
  },
  CreateAppRequest: {
    type: "object",
    properties: { name: { type: "string" } },
  },
  CreateApp200Response: {
    type: "object",
    properties: { id: { type: "string" } },
  },
  DeleteAppRequest: {
    type: "object",
    properties: { name: { type: "string" } },
  },
  DeleteApp200Response: {
    type: "object",
    properties: { deleted: { type: "boolean" } },
  },
  UpdateAppRequest: {
    type: "object",
    properties: { name: { type: "string" } },
  },
  UpdateApp200Response: {
    type: "object",
    properties: { id: { type: "string" } },
  },
};
