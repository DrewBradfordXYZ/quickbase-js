export const paths = {
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
  "/records/query": {
    post: {
      operationId: "upsertRecords", // Changed to avoid clash
      summary: "Upsert records",
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
          // Added for completeness
          description: "Multi-Status (partial success)",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/Upsert200Response" },
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
          schema: { type: "object" }, // Placeholder
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
};
