// tests/vitest/unit/fields/getFields.test.ts
import { describe, it, expect } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - getFields", () => {
  it("calls getFields successfully", async () => {
    mockFetch.mockImplementation((url: string, options: any) => {
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

    const client = createClient(mockFetch, { debug: true }); // Add debug: true for consistency
    const result = await client.getFields({
      tableId: QB_TABLE_ID_1,
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
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}&includeFieldPerms=true`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
        }),
      })
    );
  });
});
