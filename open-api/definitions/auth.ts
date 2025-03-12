// src/code-generation/definitions/auth.ts
export const authDefinitions = {
  GetTempTokenDBID200Response: {
    type: "object",
    required: ["temporaryAuthorization"],
    properties: {
      temporaryAuthorization: { type: "string" },
    },
  },
};
