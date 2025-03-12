// src/code-generation/paths/auth.ts
export const authPaths = {
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
