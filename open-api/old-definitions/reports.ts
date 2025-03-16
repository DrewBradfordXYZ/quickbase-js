// src/code-generation/definitions/reports.ts
export const reportsDefinitions = {
  ReportRunResponse: {
    type: "object",
    properties: {
      id: { type: "string" },
      data: { type: "object" },
    },
  },
};
