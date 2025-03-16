// src/code-generation/definitions/apps.ts
export const appsDefinitions = {
  App: {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      created: { type: "string", format: "date-time" },
      updated: { type: "string", format: "date-time" },
      description: { type: "string" },
      timeZone: { type: "string" },
      dateFormat: { type: "string" },
      hasEveryoneOnTheInternet: { type: "boolean" },
      memoryInfo: { $ref: "#/definitions/AppMemoryInfo" },
      securityProperties: { $ref: "#/definitions/AppSecurityProperties" },
    },
  },
  AppMemoryInfo: {
    type: "object",
    properties: {
      estMemory: { type: "number" },
      estMemoryInclDependentApps: { type: "number" },
    },
  },
  AppSecurityProperties: {
    type: "object",
    properties: {
      allowClone: { type: "boolean" },
      allowExport: { type: "boolean" },
      enableAppTokens: { type: "boolean" },
      hideFromPublic: { type: "boolean" },
      mustBeRealmApproved: { type: "boolean" },
      useIPFilter: { type: "boolean" },
    },
  },
  CreateAppRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description:
          "The app name. Multiple apps with the same name are allowed in the same realm.",
      },
      assignToken: {
        type: "boolean",
        description:
          "Set to true to assign the app to the user token used to create it. Default is false.",
      },
      description: {
        type: "string",
        description:
          "The description for the app. Defaults to blank if omitted.",
      },
      securityProperties: {
        $ref: "#/definitions/AppSecurityProperties",
        description: "Application security properties.",
      },
      variables: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
          },
          required: ["name", "value"],
        },
        description:
          "App variables (max 10, optional). See About Application Variables.",
      },
    },
  },
  CreateApp200Response: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The unique identifier for this application.",
      },
      name: { type: "string", description: "The app name." },
      description: {
        type: "string",
        description: "The description for the app.",
      },
      created: {
        type: "string",
        format: "date-time",
        description: "The time and date the app was created (ISO 8601, UTC).",
      },
      updated: {
        type: "string",
        format: "date-time",
        description:
          "The time and date the app was last updated (ISO 8601, UTC).",
      },
      dateFormat: {
        type: "string",
        description:
          "The format used for displaying dates in the app (e.g., MM-DD-YYYY).",
      },
      timeZone: {
        type: "string",
        description:
          "The time zone used for displaying time values (e.g., (UTC-08:00) Pacific Time).",
      },
      memoryInfo: {
        $ref: "#/definitions/AppMemoryInfo",
        description: "Application memory information.",
      },
      hasEveryoneOnTheInternet: {
        type: "boolean",
        description:
          "Indicates if the app includes Everyone On The Internet access.",
      },
      variables: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
          },
          required: ["name", "value"],
        },
        description: "The app variables.",
      },
      dataClassification: {
        type: "string",
        description:
          "The Data Classification label assigned to the app (optional, may be 'None').",
      },
      securityProperties: {
        $ref: "#/definitions/AppSecurityProperties",
        description: "Security properties of the application.",
      },
    },
    required: ["id", "name"],
  },
  CopyAppRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description: "The name of the newly copied app.",
      },
      description: {
        type: "string",
        description: "The description of the newly copied app.",
      },
      properties: {
        type: "object",
        properties: {
          keepData: {
            type: "boolean",
            description:
              "Whether to copy the app's data along with the schema.",
          },
          excludeFiles: {
            type: "boolean",
            description:
              "If keepData is true, whether to copy file attachments. Ignored if keepData is false.",
          },
          usersAndRoles: {
            type: "boolean",
            description:
              "If true, users will be copied along with their assigned roles. If false, users and roles will be copied but roles will not be assigned.",
          },
          assignUserToken: {
            type: "boolean",
            description:
              "Whether to add the user token used to make this request to the new app.",
          },
        },
        description:
          "The configuration properties for performing the app copy.",
      },
    },
    description: "Request body for copying an existing application.",
  },
  CopyApp200Response: {
    type: "object",
    required: ["id", "name"],
    properties: {
      id: {
        type: "string",
        description: "The unique identifier for the copied application.",
      },
      name: {
        type: "string",
        description:
          "The app name. Multiple apps with the same name are allowed in the same realm.",
      },
      description: {
        type: "string",
        description: "The description for the app.",
      },
      created: {
        type: "string",
        format: "date-time",
        description: "The time and date the app was created (ISO 8601, UTC).",
      },
      updated: {
        type: "string",
        format: "date-time",
        description:
          "The time and date the app was last updated (ISO 8601, UTC).",
      },
      dateFormat: {
        type: "string",
        description:
          "The format used for displaying dates in the app (e.g., MM-DD-YYYY).",
      },
      timeZone: {
        type: "string",
        description:
          "The time zone used for displaying time values (e.g., (UTC-08:00) Pacific Time).",
      },
      hasEveryoneOnTheInternet: {
        type: "boolean",
        description:
          "Indicates if the app includes Everyone On The Internet access.",
      },
      variables: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" },
          },
          required: ["name", "value"],
        },
        description: "The app variables.",
      },
      ancestorId: {
        type: "string",
        description: "The id of the app from which this app was copied.",
      },
      dataClassification: {
        type: "string",
        description:
          "The Data Classification label assigned to the app (optional, may be 'None').",
      },
    },
    description: "Response body for successful app copy operation.",
  },
  DeleteAppRequest: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description:
          "The name of the application to delete, required for confirmation.",
      },
    },
    description:
      "Request body for deleting an application, requiring the app name for confirmation.",
  },
  DeleteApp200Response: {
    type: "object",
    properties: {
      deletedAppId: {
        type: "string",
        description: "The ID of the deleted application.",
      },
    },
    required: ["deletedAppId"],
    description: "Response body for successful deletion of an application.",
  },
};
