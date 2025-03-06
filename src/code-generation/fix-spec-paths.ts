export const paths = {
  "/fields": {
    get: {
      operationId: "getFields",
      summary: "Get fields for a table",
      tags: ["Fields"],
      parameters: [
        { name: "tableId", in: "query", required: true, type: "string" },
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
          schema: { type: "array", items: { $ref: "#/definitions/Field" } },
        },
      },
    },
    post: {
      operationId: "createField",
      summary: "Create a field",
      tags: ["Fields"],
      parameters: [
        { name: "tableId", in: "query", required: true, type: "string" },
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
          schema: { $ref: "#/definitions/CreateField200Response" },
        },
      },
    },
    delete: {
      operationId: "deleteFields",
      summary: "Delete fields",
      tags: ["Fields"],
      parameters: [
        { name: "tableId", in: "query", required: true, type: "string" },
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
          schema: { $ref: "#/definitions/DeleteFields200Response" },
        },
      },
    },
  },
  "/tables/{tableId}": {
    get: {
      operationId: "getTable",
      summary: "Get table details",
      tags: ["Tables"],
      parameters: [
        { name: "appId", in: "query", required: true, type: "string" },
        { name: "tableId", in: "path", required: true, type: "string" },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/Table" },
        },
      },
    },
  },
  "/apps/{appId}": {
    get: {
      operationId: "getAppById",
      summary: "Get application details by ID",
      tags: ["Apps"],
      parameters: [
        { name: "appId", in: "path", required: true, type: "string" },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/App" },
        },
      },
    },
    post: {
      operationId: "updateApp",
      summary: "Update an app",
      tags: ["Apps"],
      parameters: [
        { name: "appId", in: "path", required: true, type: "string" },
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/UpdateAppRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/UpdateApp200Response" },
        },
      },
    },
    delete: {
      operationId: "deleteApp",
      summary: "Delete an app",
      tags: ["Apps"],
      parameters: [
        { name: "appId", in: "path", required: true, type: "string" },
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/DeleteAppRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/DeleteApp200Response" },
        },
      },
    },
  },
  "/apps": {
    post: {
      operationId: "createApp",
      summary: "Create an app",
      tags: ["Apps"],
      parameters: [
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/CreateAppRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/CreateApp200Response" },
        },
      },
    },
  },
  "/apps/{appId}/copy": {
    post: {
      operationId: "copyApp",
      summary: "Copy an app",
      tags: ["Apps"],
      parameters: [
        { name: "appId", in: "path", required: true, type: "string" },
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { $ref: "#/definitions/CopyAppRequest" },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/CopyApp200Response" },
        },
      },
    },
  },
  "/apps/{appId}/events": {
    get: {
      operationId: "getAppEvents",
      summary: "Get app events",
      tags: ["Apps"],
      parameters: [
        { name: "appId", in: "path", required: true, type: "string" },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
  "/records": {
    post: {
      operationId: "upsert",
      summary: "Upsert records",
      tags: ["Records"],
      parameters: [
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
          schema: { $ref: "#/definitions/Upsert200Response" },
        },
      },
    },
  },
};
