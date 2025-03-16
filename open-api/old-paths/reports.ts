// src/code-generation/paths/reports.ts
export const reportsPaths = {
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
          description: "The report identifier.",
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
};
