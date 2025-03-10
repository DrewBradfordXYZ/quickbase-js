// src/code-generation/fix-spec-paths.ts
export const paths = {
  "/apps": {
    post: {
      operationId: "createApp",
      summary: "Create a new application",
      tags: ["Apps"],
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/CreateAppRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - application created",
          schema: { $ref: "#/definitions/CreateApp200Response" },
        },
      },
    },
  },
  "/apps/{appId}": {
    get: {
      operationId: "getApp",
      summary: "Get an app by ID",
      tags: ["Apps"],
      parameters: [
        {
          name: "appId",
          in: "path",
          required: true,
          type: "string",
          description: "The application identifier.",
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/App" },
        },
      },
    },
  },
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
  },
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
  "/records": {
    post: {
      operationId: "upsert",
      summary: "Upsert records in a table",
      tags: ["Records"],
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/UpsertRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - all records processed successfully",
          schema: { $ref: "#/definitions/Upsert200Response" },
        },
        207: {
          description: "Multi-Status - partial success with some errors",
          schema: { $ref: "#/definitions/Upsert207Response" },
        },
      },
    },
    delete: {
      operationId: "deleteRecords",
      summary: "Delete records in a table",
      tags: ["Records"],
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/DeleteRecordsRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - records deleted",
          schema: { $ref: "#/definitions/DeleteRecords200Response" },
        },
      },
    },
  },
  "/records/query": {
    post: {
      operationId: "upsertRecords",
      summary: "Upsert records (alternative endpoint)",
      tags: ["Records"],
      parameters: [
        {
          name: "generated",
          in: "body",
          required: true,
          schema: {
            type: "array",
            items: { $ref: "#/definitions/Record" },
          },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/Upsert200Response" },
          },
        },
        207: {
          description: "Multi-Status (partial success)",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/Upsert207Response" },
          },
        },
      },
    },
  },
  "/reports/{reportId}/run": {
    post: {
      operationId: "runReport",
      summary: "Run a report",
      tags: ["Reports"],
      parameters: [
        {
          name: "reportId",
          in: "path",
          required: true,
          type: "string",
          description: "The report identifier.",
        },
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { type: "object" },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/ReportRunResponse" },
          },
        },
      },
    },
  },
  "/auth/temporary/{dbid}": {
    get: {
      operationId: "getTempTokenDBID",
      summary: "Get a temporary authorization token for a specific dbid",
      tags: ["Auth"],
      parameters: [
        {
          name: "dbid",
          in: "path",
          required: true,
          type: "string",
          description: "The database identifier (dbid).",
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/GetTempTokenDBID200Response" },
        },
      },
    },
  },
};
