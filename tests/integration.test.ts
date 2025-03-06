import { describe, it, expect } from "vitest";
import { quickbaseClient } from "../src/quickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config();

describe("QuickbaseClient Integration", () => {
  const client = quickbaseClient({
    realm: process.env.QB_REALM!,
    userToken: process.env.QB_USER_TOKEN!,
    debug: true,
  });

  it(
    "fetches real app data from QuickBase",
    async () => {
      const appId = process.env.QB_APP_ID;
      if (!appId) throw new Error("QB_APP_ID is not defined in .env");
      if (!process.env.QB_REALM)
        throw new Error("QB_REALM is not defined in .env");
      if (!process.env.QB_USER_TOKEN)
        throw new Error("QB_USER_TOKEN is not defined in .env");

      console.log("Config used:", {
        realm: process.env.QB_REALM,
        userToken: process.env.QB_USER_TOKEN,
        appId,
      });
      const result = await client.getApp({ appId });
      console.log("Real API response:", result);
      expect(result).toEqual({
        id: appId,
        name: "qb-copy",
        created: new Date("2025-02-13T18:22:33Z"),
        updated: new Date("2025-03-04T04:25:51Z"),
        description: "",
        timeZone: "(UTC-08:00) Pacific Time (US & Canada)",
        dateFormat: "MM-DD-YYYY",
        hasEveryoneOnTheInternet: false,
        memoryInfo: {
          estMemory: 0,
          estMemoryInclDependentApps: 0,
        },
        securityProperties: {
          allowClone: false,
          allowExport: true,
          enableAppTokens: true,
          hideFromPublic: false,
          mustBeRealmApproved: false,
          useIPFilter: false,
        },
      });
    },
    { timeout: 10000 }
  );

  it(
    "fetches real field data from QuickBase",
    async () => {
      const tableId = "buwai2z3s"; // From your curl
      if (!tableId) throw new Error("Table ID is not defined");
      if (!process.env.QB_REALM)
        throw new Error("QB_REALM is not defined in .env");
      if (!process.env.QB_USER_TOKEN)
        throw new Error("QB_USER_TOKEN is not defined in .env");

      console.log("Config used:", {
        realm: process.env.QB_REALM,
        userToken: process.env.QB_USER_TOKEN,
        tableId,
      });
      const result = await client.getFields({
        tableId,
        includeFieldPerms: true,
      });
      console.log("Real API response:", result);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            label: "Date Created",
            fieldType: "timestamp",
            appearsByDefault: false,
            audited: false,
            bold: false,
            doesDataCopy: false,
            fieldHelp: "",
            findEnabled: false,
            mode: "",
            noWrap: true,
            required: false,
            unique: false,
            addToForms: undefined,
            permissions: expect.arrayContaining([
              expect.objectContaining({
                permissionType: "Modify",
                role: "Viewer",
                roleId: 10,
              }),
              expect.objectContaining({
                permissionType: "Modify",
                role: "Participant",
                roleId: 11,
              }),
              expect.objectContaining({
                permissionType: "Modify",
                role: "Administrator",
                roleId: 12,
              }),
            ]),
            properties: expect.objectContaining({
              allowNewChoices: false,
              carryChoices: true,
              defaultToday: false,
              defaultValue: "",
              displayDayOfWeek: false,
              displayMonth: "number",
              displayRelative: false,
              displayTime: true,
              displayTimezone: false,
              foreignKey: false,
              formula: "",
              primaryKey: false,
              sortAsGiven: true,
            }),
          }),
          expect.objectContaining({
            id: 3,
            label: "Record ID#",
            fieldType: "recordid",
            appearsByDefault: false,
            audited: false,
            bold: false,
            doesDataCopy: false,
            fieldHelp: "",
            findEnabled: false,
            mode: "",
            noWrap: true,
            required: false,
            unique: true,
            addToForms: undefined,
            permissions: expect.arrayContaining([
              expect.objectContaining({
                permissionType: "Modify",
                role: "Viewer",
                roleId: 10,
              }),
              expect.objectContaining({
                permissionType: "Modify",
                role: "Participant",
                roleId: 11,
              }),
              expect.objectContaining({
                permissionType: "Modify",
                role: "Administrator",
                roleId: 12,
              }),
            ]),
            properties: expect.objectContaining({
              primaryKey: true,
              foreignKey: false,
              formula: "",
              defaultValue: "",
              carryChoices: true,
              allowNewChoices: false,
              sortAsGiven: true,
              numberFormat: 0,
              decimalPlaces: 0,
              doesAverage: false,
              doesTotal: false,
              blankIsZero: true,
              commaStart: 4,
            }),
          }),
        ])
      );
    },
    { timeout: 10000 }
  );
});
