// src/code-generation/definitions/relationships.ts
export const relationshipsDefinitions = {
  GetRelationships200Response: {
    type: "object",
    properties: {
      metadata: {
        type: "object",
        properties: {
          numRelationships: {
            type: "integer",
            description:
              "The number of relationships in the current response object.",
          },
          skip: {
            type: "integer",
            description: "The number of relationships skipped.",
          },
          totalRelationships: {
            type: "integer",
            description: "The total number of relationships.",
          },
        },
        required: ["numRelationships", "skip", "totalRelationships"],
        description:
          "Additional information about the results that may be helpful.",
      },
      relationships: {
        type: "array",
        items: { $ref: "#/definitions/Relationship" },
        description: "The relationships in a table.",
      },
    },
    required: ["metadata", "relationships"],
    description: "Response containing relationships for a table.",
  },
  Relationship: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        description: "The relationship id (foreign key field id).",
      },
      parentTableId: {
        type: "string",
        description: "The parent table id of the relationship.",
      },
      childTableId: {
        type: "string",
        description: "The child table id of the relationship.",
      },
      foreignKeyField: {
        $ref: "#/definitions/RelationshipField",
        description: "The foreign key field information.",
      },
      isCrossApp: {
        type: "boolean",
        description: "Whether this is a cross-app relationship.",
      },
      lookupFields: {
        type: "array",
        items: { $ref: "#/definitions/RelationshipField" },
        description: "The lookup fields array.",
      },
      summaryFields: {
        type: "array",
        items: { $ref: "#/definitions/RelationshipField" },
        description: "The summary fields array.",
      },
    },
    required: [
      "id",
      "parentTableId",
      "childTableId",
      "foreignKeyField",
      "isCrossApp",
    ],
    description: "A relationship between tables.",
  },
  RelationshipField: {
    type: "object",
    properties: {
      id: { type: "integer", description: "Field id." },
      label: { type: "string", description: "Field label." },
      type: { type: "string", description: "Field type." },
    },
    required: ["id", "label", "type"],
    description:
      "A field involved in a relationship (foreign key, lookup, or summary).",
  },
};
