// src/code-generation/paths/tables.ts
export const tablesPaths = {
  "/tables": {
    get: {
      operationId: "getAppTables",
      summary: "Get all tables for an app",
      tags: ["Tables"],
      parameters: [
        {
          name: "appId",
          in: "query",
          required: true,
          type: "string",
          description: "The application identifier.",
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/Table" },
          },
        },
      },
    },
    post: {
      operationId: "createTable",
      summary: "Create a new table in an app",
      tags: ["Tables"],
      parameters: [
        {
          name: "appId",
          in: "query",
          required: true,
          type: "string",
          description:
            "The unique identifier of the app where the table will be created.",
        },
        {
          name: "body",
          in: "body",
          required: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "The name of the table." },
              description: {
                type: "string",
                description: "The description of the table.",
              },
              singleRecordName: {
                type: "string",
                description: "Singular noun for records.",
              },
              pluralRecordName: {
                type: "string",
                description: "Plural noun for records.",
              },
            },
            required: ["name"],
          },
        },
      ],
      responses: {
        200: {
          description: "Success - table created",
          schema: { $ref: "#/definitions/Table" },
        },
      },
    },
  },
  "/tables/{tableId}": {
    get: {
      operationId: "getTable",
      summary: "Get a table by ID",
      tags: ["Tables"],
      parameters: [
        {
          name: "tableId",
          in: "path",
          required: true,
          type: "string",
          description: "The table identifier (dbid).",
        },
        {
          name: "appId",
          in: "query",
          required: true,
          type: "string",
          description: "The unique identifier of the app containing the table.",
        },
      ],
      responses: {
        200: {
          description: "Success - table retrieved",
          schema: { $ref: "#/definitions/Table" },
        },
      },
    },
    post: {
      operationId: "updateTable",
      summary: "Update a table by ID",
      tags: ["Tables"],
      parameters: [
        {
          name: "tableId",
          in: "path",
          required: true,
          type: "string",
          description: "The table identifier (dbid).",
        },
        {
          name: "appId",
          in: "query",
          required: true,
          type: "string",
          description: "The unique identifier of the app containing the table.",
        },
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/UpdateTableRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - table updated",
          schema: { $ref: "#/definitions/Table" },
        },
      },
    },
    delete: {
      operationId: "deleteTable",
      summary: "Delete a table by ID",
      tags: ["Tables"],
      parameters: [
        {
          name: "tableId",
          in: "path",
          required: true,
          type: "string",
          description: "The table identifier (dbid).",
        },
        {
          name: "appId",
          in: "query",
          required: true,
          type: "string",
          description: "The unique identifier of the app containing the table.",
        },
      ],
      responses: {
        200: {
          description: "Success - table deleted",
          schema: { $ref: "#/definitions/DeleteTableResponse" },
        },
      },
    },
  },
};
