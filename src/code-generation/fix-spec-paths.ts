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
    delete: {
      // New DELETE method for deleteApp
      operationId: "deleteApp",
      summary: "Delete an application by ID",
      tags: ["Apps"],
      parameters: [
        {
          name: "appId",
          in: "path",
          required: true,
          type: "string",
          description: "The unique identifier of the app to delete.",
        },
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/DeleteAppRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - application deleted",
          schema: { $ref: "#/definitions/DeleteApp200Response" },
        },
      },
    },
  },
  "/apps/{appId}/copy": {
    post: {
      operationId: "copyApp",
      summary: "Copy an existing application",
      tags: ["Apps"],
      parameters: [
        {
          name: "appId",
          in: "path",
          required: true,
          type: "string",
          description: "The unique identifier of the app to copy.",
        },
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/CopyAppRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - application copied",
          schema: { $ref: "#/definitions/CopyApp200Response" },
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
  "/tables/{tableId}/relationships": {
    get: {
      operationId: "getRelationships",
      summary: "Get relationships for a table",
      tags: ["Relationships"],
      parameters: [
        {
          name: "tableId",
          in: "path",
          required: true,
          type: "string",
          description: "The unique identifier (dbid) of the child table.",
        },
        {
          name: "skip",
          in: "query",
          required: false,
          type: "integer",
          description: "The number of relationships to skip.",
        },
      ],
      responses: {
        200: {
          description: "Success - relationships retrieved",
          schema: { $ref: "#/definitions/GetRelationships200Response" },
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
      operationId: "runQuery",
      summary: "Query records in a table",
      tags: ["Records"],
      parameters: [
        {
          name: "body",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/RunQueryRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success - records returned",
          schema: { $ref: "#/definitions/RunQueryResponse" },
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
