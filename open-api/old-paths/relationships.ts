// src/code-generation/paths/relationships.ts
export const relationshipsPaths = {
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
};
