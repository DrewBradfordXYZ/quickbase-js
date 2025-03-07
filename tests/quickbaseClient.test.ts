import { describe, it, expect, vi, beforeEach } from "vitest";
import { quickbaseClient } from "../src/quickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config();

describe("QuickbaseClient", () => {
  const mockFetchApp = vi.fn((url: string, options: any) => {
    console.log("Mock fetch:", url, options);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: process.env.QB_APP_ID,
          name: "qb-copy",
          created: "2025-02-13T18:22:33Z",
          updated: "2025-03-04T04:25:51Z",
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
        }),
    } as Response);
  });

  const client = quickbaseClient({
    realm: process.env.QB_REALM || "default-realm",
    userToken: process.env.QB_USER_TOKEN || "default-token",
    debug: true,
    fetchApi: mockFetchApp as any,
  });

  beforeEach(() => {
    mockFetchApp.mockClear();
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has getApp method", () => {
    expect(typeof client.getApp).toBe("function");
  });

  it("calls getApp successfully", async () => {
    const getAppId = process.env.QB_APP_ID; // Unique name to avoid conflict
    if (!getAppId) throw new Error("QB_APP_ID is not defined in .env");
    console.log("Test appId:", getAppId);
    const result = await client.getApp({ appId: getAppId });
    expect(result).toEqual({
      id: getAppId,
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
    expect(mockFetchApp).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/apps/${getAppId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
        }),
      })
    );
  });

  it("calls getFields successfully", async () => {
    const mockFetchFields = vi.fn((url: string, options: any) => {
      console.log("Mock fetch for getFields:", url, options);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              label: "Field1",
              fieldType: "text",
              noWrap: false,
              bold: false,
              required: false,
              appearsByDefault: false,
              findEnabled: false,
              unique: false,
              doesDataCopy: false,
              fieldHelp: "field help",
              audited: false,
              properties: {
                primaryKey: false,
                foreignKey: false,
                numLines: 1,
                maxLength: 0,
                appendOnly: false,
                allowHTML: false,
                allowMentions: false,
                sortAsGiven: false,
                carryChoices: true,
                allowNewChoices: false,
                formula: "",
                defaultValue: "",
              },
              permissions: [
                { permissionType: "View", role: "Viewer", roleId: 10 },
                { permissionType: "None", role: "Participant", roleId: 11 },
                { permissionType: "Modify", role: "Administrator", roleId: 12 },
              ],
            },
          ]),
      } as Response);
    });

    const clientWithMock = quickbaseClient({
      realm: process.env.QB_REALM || "default-realm",
      userToken: process.env.QB_USER_TOKEN || "default-token",
      debug: true,
      fetchApi: mockFetchFields as any,
    });

    const result = await clientWithMock.getFields({
      tableId: "dummyTableId",
      includeFieldPerms: true,
    });
    console.log("getFields response:", result);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          label: "Field1",
          fieldType: "text",
          noWrap: false,
          bold: false,
          required: false,
          appearsByDefault: false,
          findEnabled: false,
          unique: false,
          doesDataCopy: false,
          fieldHelp: "field help",
          audited: false,
          properties: expect.objectContaining({
            primaryKey: false,
            foreignKey: false,
            numLines: 1,
            maxLength: 0,
            appendOnly: false,
            allowHTML: false,
            allowMentions: false,
            sortAsGiven: false,
            carryChoices: true,
            allowNewChoices: false,
            formula: "",
            defaultValue: "",
          }),
          permissions: expect.arrayContaining([
            expect.objectContaining({
              permissionType: "View",
              role: "Viewer",
              roleId: 10,
            }),
            expect.objectContaining({
              permissionType: "None",
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
    expect(mockFetchFields).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=dummyTableId&includeFieldPerms=true`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
        }),
      })
    );
  });

  it("calls getAppTables successfully", async () => {
    const mockFetchTables = vi.fn((url: string, options: any) => {
      console.log("Mock fetch for getAppTables:", url, options);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              alias: "_DBID_ROOT",
              created: "2025-02-13T18:22:33Z",
              defaultSortFieldId: 2,
              defaultSortOrder: "DESC",
              description: "",
              id: "buwai2zr4",
              keyFieldId: 3,
              name: "Root",
              nextFieldId: 6,
              nextRecordId: 1,
              pluralRecordName: "Roots",
              singleRecordName: "Root",
              sizeLimit: "500 MB",
              spaceRemaining: "500 MB",
              spaceUsed: "0 KB",
              updated: "2025-02-13T18:22:34Z",
            },
          ]),
      } as Response);
    });

    const clientWithMock = quickbaseClient({
      realm: process.env.QB_REALM || "default-realm",
      userToken: process.env.QB_USER_TOKEN || "default-token",
      debug: true,
      fetchApi: mockFetchTables as any,
    });

    const tablesAppId = process.env.QB_APP_ID; // Unique name to avoid conflict
    if (!tablesAppId) throw new Error("QB_APP_ID is not defined in .env");
    const result = await clientWithMock.getAppTables({ appId: tablesAppId });
    console.log("getAppTables response:", result);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          alias: "_DBID_ROOT",
          created: new Date("2025-02-13T18:22:33Z"),
          defaultSortFieldId: 2,
          defaultSortOrder: "DESC",
          description: "",
          id: "buwai2zr4",
          keyFieldId: 3,
          name: "Root",
          nextFieldId: 6,
          nextRecordId: 1,
          pluralRecordName: "Roots",
          singleRecordName: "Root",
          sizeLimit: "500 MB",
          spaceRemaining: "500 MB",
          spaceUsed: "0 KB",
          updated: new Date("2025-02-13T18:22:34Z"),
        }),
      ])
    );
    expect(mockFetchTables).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/tables?appId=${tablesAppId}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
        }),
      })
    );
  });
});
