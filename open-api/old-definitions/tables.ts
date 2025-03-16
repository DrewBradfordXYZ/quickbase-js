// src/code-generation/definitions/tables.ts
export const tablesDefinitions = {
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
};
