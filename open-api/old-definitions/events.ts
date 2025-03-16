// open-api/definitions/events.ts
export const eventsDefinitions = {
  AppEvent: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: [
          "webhook",
          "qb-action",
          "email-notification",
          "subscription",
          "reminder",
          "automation",
        ],
        description: "Type of the event.",
      },
      name: {
        type: "string",
        description:
          "The name of the event. This property is not returned for automations.",
      },
      url: {
        type: "string",
        description:
          "The URL to the automation, accessible from the browser. Only returned for automations.",
      },
      isActive: {
        type: "boolean",
        description: "Indication of whether the current event is active.",
      },
      owner: {
        $ref: "#/definitions/EventOwner",
        description: "The user that owns the event.",
      },
      tableId: {
        type: "string",
        description:
          "The unique identifier of the table to which the event belongs.",
      },
    },
    required: ["type", "isActive", "owner", "tableId"],
    description: "An event associated with an application in QuickBase.",
  },
  EventOwner: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "User full name.",
      },
      id: {
        type: "string",
        description: "User ID.",
      },
      email: {
        type: "string",
        description: "User email.",
      },
      userName: {
        type: "string",
        description:
          "User name as updated in user properties. Optional, appears if not the same as user email.",
      },
    },
    required: ["name", "id", "email"],
    description: "The owner of an event in QuickBase.",
  },
};
