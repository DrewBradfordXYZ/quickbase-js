// open-api/paths/events.ts
export const eventsPaths = {
  "/apps/{appId}/events": {
    get: {
      operationId: "getAppEvents",
      summary: "Get all events for an application",
      description:
        "Retrieves a list of all events (e.g., webhooks, actions, automations) associated with the specified application.",
      tags: ["Events"],
      parameters: [
        {
          name: "appId",
          in: "path",
          required: true,
          type: "string",
          description: "The unique identifier of an app",
        },
      ],
      responses: {
        200: {
          description: "Success - list of app events retrieved",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/AppEvent" },
          },
        },
      },
    },
  },
};
