// src/code-generation/fix-spec-paths.ts
export const paths = {
  "/apps": {
    post: {
      operationId: "createApp",
      summary: "Create a new application",
      tags: ["Apps"],
      parameters: [
        {
          name: "request",
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
        },
        {
          name: "includeFieldPerms",
          in: "query",
          required: false,
          type: "boolean",
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
  },
  "/records": {
    post: {
      operationId: "upsert",
      summary: "Upsert records in a table",
      tags: ["Records"],
      parameters: [
        {
          name: "request",
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
