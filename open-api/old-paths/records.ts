// src/code-generation/paths/records.ts
export const recordsPaths = {
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
};
