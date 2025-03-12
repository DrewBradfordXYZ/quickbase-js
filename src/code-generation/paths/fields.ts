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
  },
};
