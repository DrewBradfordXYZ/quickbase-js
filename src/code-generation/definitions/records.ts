// src/code-generation/definitions/records.ts
export const recordsDefinitions = {
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
};
