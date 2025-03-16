// src/code-generation/paths/apps.ts
export const appsPaths = {
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
};
