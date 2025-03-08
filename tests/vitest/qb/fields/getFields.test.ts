import { describe, it, expect } from "vitest";
import { createClient } from "../../../setup.ts";

describe("QuickbaseClient Integration - getFields", () => {
  const client = createClient();

  it(
    "fetches real field data from QuickBase",
    async () => {
      const tableId = "buwai2z3s";
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
            noWrap: true,
            bold: false,
            required: false,
            appearsByDefault: false,
            findEnabled: false,
            unique: false,
            doesDataCopy: false,
            fieldHelp: "",
            audited: false,
            properties: expect.objectContaining({
              primaryKey: false,
              foreignKey: false,
              sortAsGiven: true,
              carryChoices: true,
              allowNewChoices: false,
              formula: "",
              defaultValue: "",
            }),
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
          }),
          expect.objectContaining({
            id: 2,
            label: "Date Modified",
            fieldType: "timestamp",
            noWrap: true,
            bold: false,
            required: false,
            appearsByDefault: false,
            findEnabled: false,
            unique: false,
            doesDataCopy: false,
            fieldHelp: "",
            audited: false,
            properties: expect.objectContaining({
              primaryKey: false,
              foreignKey: false,
              sortAsGiven: true,
              carryChoices: true,
              allowNewChoices: false,
              formula: "",
              defaultValue: "",
            }),
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
          }),
          expect.objectContaining({
            id: 3,
            label: "Record ID#",
            fieldType: "recordid",
            noWrap: true,
            bold: false,
            required: false,
            appearsByDefault: false,
            findEnabled: false,
            unique: true,
            doesDataCopy: false,
            fieldHelp: "",
            audited: false,
            properties: expect.objectContaining({
              primaryKey: true,
              foreignKey: false,
              sortAsGiven: true,
              carryChoices: true,
              allowNewChoices: false,
              formula: "",
              defaultValue: "",
            }),
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
          }),
          expect.objectContaining({
            id: 4,
            label: "Record Owner",
            fieldType: "user",
            noWrap: true,
            bold: false,
            required: false,
            appearsByDefault: false,
            findEnabled: true,
            unique: false,
            doesDataCopy: false,
            fieldHelp: "",
            audited: false,
            properties: expect.objectContaining({
              primaryKey: false,
              foreignKey: false,
              sortAsGiven: true,
              carryChoices: true,
              allowNewChoices: true,
              formula: "",
              defaultValue: "",
            }),
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
          }),
          expect.objectContaining({
            id: 5,
            label: "Last Modified By",
            fieldType: "user",
            noWrap: true,
            bold: false,
            required: false,
            appearsByDefault: false,
            findEnabled: true,
            unique: false,
            doesDataCopy: false,
            fieldHelp: "",
            audited: false,
            properties: expect.objectContaining({
              primaryKey: false,
              foreignKey: false,
              sortAsGiven: true,
              carryChoices: true,
              allowNewChoices: true,
              formula: "",
              defaultValue: "",
            }),
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
          }),
        ])
      );
    },
    { timeout: 10000 }
  );
});
