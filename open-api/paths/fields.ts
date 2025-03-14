// src/code-generation/paths/fields.ts
export const fieldsPaths = {
  "/fields": {
    get: {
      operationId: "getFields",
      summary: "Get all fields for a table",
      tags: ["Fields"],
      parameters: [
        {
          name: "tableId",
          in: "query",
          required: true,
          type: "string",
          description: "The table identifier (dbid).",
        },
        {
          name: "includeFieldPerms",
          in: "query",
          required: false,
          type: "boolean",
          description: "Whether to include field permissions.",
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/Field" },
          },
        },
      },
    },
    post: {
      operationId: "createField",
      summary: "Create a new field in a table",
      tags: ["Fields"],
      parameters: [
        {
          name: "tableId",
          in: "query",
          required: true,
          type: "string",
          description: "The unique identifier of the table.",
        },
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/CreateFieldRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - field created",
          schema: { $ref: "#/definitions/CreateField200Response" },
        },
      },
    },
    delete: {
      operationId: "deleteFields",
      summary: "Delete fields from a table",
      tags: ["Fields"],
      parameters: [
        {
          name: "tableId",
          in: "query",
          required: true,
          type: "string",
          description: "The unique identifier of the table.",
        },
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/DeleteFieldsRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - fields deleted, with possible errors",
          schema: { $ref: "#/definitions/DeleteFields200Response" },
        },
      },
    },
  },
  "/fields/{fieldId}": {
    get: {
      operationId: "getField",
      summary: "Get the properties of an individual field by ID",
      tags: ["Fields"],
      parameters: [
        {
          name: "fieldId",
          in: "path",
          required: true,
          type: "integer",
          description: "The unique identifier (fid) of the field.",
        },
        {
          name: "tableId",
          in: "query",
          required: true,
          type: "string",
          description: "The unique identifier (dbid) of the table.",
        },
        {
          name: "includeFieldPerms",
          in: "query",
          required: false,
          type: "boolean",
          description:
            "Set to 'true' to include custom permissions for the field.",
        },
      ],
      responses: {
        200: {
          description: "Success - field properties retrieved",
          schema: { $ref: "#/definitions/Field" },
        },
      },
    },
  },
  "/fields/usage": {
    get: {
      operationId: "getFieldsUsage",
      summary: "Get usage statistics for all fields in a table",
      tags: ["Fields"],
      parameters: [
        {
          name: "tableId",
          in: "query",
          required: true,
          type: "string",
          description: "The unique identifier (dbid) of the table.",
        },
        {
          name: "skip",
          in: "query",
          required: false,
          type: "integer",
          description: "The number of fields to skip from the list.",
        },
        {
          name: "top",
          in: "query",
          required: false,
          type: "integer",
          description: "The maximum number of fields to return.",
        },
      ],
      responses: {
        200: {
          description: "Success - field usage statistics retrieved",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/FieldUsage" },
          },
        },
      },
    },
  },
  "/fields/usage/{fieldId}": {
    get: {
      operationId: "getFieldUsage",
      summary: "Get usage statistics for a single field",
      description:
        "Retrieve usage statistics for a specific field, summarizing where it is referenced across QuickBase features such as reports, forms, and pipelines.",
      tags: ["Fields"],
      parameters: [
        {
          name: "fieldId",
          in: "path",
          required: true,
          type: "integer",
          description: "The unique identifier (fid) of the field.",
        },
        {
          name: "tableId",
          in: "query",
          required: true,
          type: "string",
          description:
            "The unique identifier (dbid) of the table containing the field.",
        },
        {
          name: "User-Agent",
          in: "header",
          required: false,
          type: "string",
          description:
            "Identifies the client making the request. Can be custom or default from your toolkit.",
        },
      ],
      responses: {
        200: {
          description: "Success - field usage statistics retrieved",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/FieldUsage" },
            maxItems: 1, // Ensures a single-item array as per QuickBase API behavior
          },
        },
      },
    },
  },
};
