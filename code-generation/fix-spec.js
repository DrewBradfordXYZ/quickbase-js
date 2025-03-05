#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import * as glob from "glob";

async function fixQuickBaseSpec() {
  try {
    const CODEGEN_DIR = path.dirname(new URL(import.meta.url).pathname);
    const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs");
    console.log("Finding latest QuickBase RESTful API spec...");
    const specFiles = glob.sync(
      path.join(SPECS_DIR, "QuickBase_RESTful_*.json")
    );
    if (specFiles.length === 0) {
      console.error(
        "No QuickBase_RESTful_*.json files found in specs/ folder."
      );
      process.exit(1);
    }
    const inputFile = specFiles.sort().pop();
    const outputFile = path.join(CODEGEN_DIR, "quickbase-fixed.json");

    console.log(`Reading ${path.basename(inputFile)} from specs/...`);
    const specContent = await fs.readFile(inputFile, "utf8");
    const spec = JSON.parse(specContent);

    console.log("Fixing parameters...");
    for (const pathKey in spec.paths) {
      for (const method in spec.paths[pathKey]) {
        const operation = spec.paths[pathKey][method];
        if (operation.parameters) {
          operation.parameters = operation.parameters.map((param) => {
            if ("example" in param) delete param.example;
            if ("schema" in param && param.in !== "body") delete param.schema;
            if (!param.type && param.in !== "body") param.type = "string";
            if (
              param.name === "generated" &&
              param.schema?.type === "array" &&
              !param.schema.items
            ) {
              param.schema.items = { $ref: "#/definitions/Record" }; // Fix generated param if array
            }
            return param;
          });
        }
      }
    }

    console.log("Adding responses and schemas...");
    if (spec.paths["/fields"]?.get) {
      spec.paths["/fields"].get.parameters = [
        { name: "tableId", in: "query", required: true, type: "string" },
        {
          name: "includeFieldPerms",
          in: "query",
          required: false,
          type: "boolean",
        },
      ];
      spec.paths["/fields"].get.responses = {
        200: {
          description: "Successful response",
          schema: { type: "array", items: { $ref: "#/definitions/Field" } },
        },
      };
    }
    if (spec.paths["/fields/{fieldId}"]?.get) {
      spec.paths["/fields/{fieldId}"].get.responses = {
        200: {
          description: "Successful response",
          schema: { $ref: "#/definitions/Field" },
        },
      };
    }
    if (spec.paths["/tables/{tableId}"]?.get) {
      spec.paths["/tables/{tableId}"].get.parameters = [
        { name: "appId", in: "query", required: true, type: "string" },
        { name: "tableId", in: "path", required: true, type: "string" },
      ];
      spec.paths["/tables/{tableId}"].get.responses = {
        200: {
          description: "Successful response",
          schema: { $ref: "#/definitions/Table" },
        },
      };
    }
    if (spec.paths["/apps/{appId}"]?.get) {
      spec.paths["/apps/{appId}"].get.responses = {
        200: {
          description: "Successful response",
          schema: { $ref: "#/definitions/App" },
        },
      };
    }
    if (spec.paths["/records"]?.post) {
      spec.paths["/records"].post.parameters = [
        {
          name: "generated",
          in: "body",
          required: true,
          schema: {
            type: "array",
            items: { $ref: "#/definitions/RecordRequest" },
          },
        },
      ];
      spec.paths["/records"].post.responses = {
        200: {
          description: "Successful response",
          schema: { type: "array", items: { $ref: "#/definitions/Record" } },
        },
        207: {
          description: "Partial success",
          schema: { type: "array", items: { $ref: "#/definitions/Record" } },
        },
      };
    }
    if (spec.paths["/records/query"]?.post) {
      spec.paths["/records/query"].post.parameters = [
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { type: "object", additionalProperties: true }, // Query body is complex, adjust as needed
        },
      ];
      spec.paths["/records/query"].post.responses = {
        200: {
          description: "Successful response",
          schema: { type: "array", items: { $ref: "#/definitions/Record" } },
        },
      };
    }
    if (spec.paths["/reports/{reportId}/run"]?.post) {
      spec.paths["/reports/{reportId}/run"].post.responses = {
        200: {
          description: "Successful response",
          schema: {
            type: "array",
            items: { $ref: "#/definitions/ReportData" },
          },
        },
      };
    }

    console.log("Adding definitions...");
    if (!spec.definitions) spec.definitions = {};
    spec.definitions.Field = {
      type: "object",
      properties: {
        appearsByDefault: { type: "boolean" },
        audited: { type: "boolean" },
        bold: { type: "boolean" },
        doesDataCopy: { type: "boolean" },
        fieldHelp: { type: "string" },
        fieldType: { type: "string" },
        findEnabled: { type: "boolean" },
        id: { type: "integer" },
        label: { type: "string" },
        mode: { type: "string" },
        noWrap: { type: "boolean" },
        properties: { type: "object", additionalProperties: true },
        required: { type: "boolean" },
        unique: { type: "boolean" },
      },
    };
    spec.definitions.Table = {
      type: "object",
      properties: {
        alias: { type: "string" },
        created: { type: "string" },
        defaultSortFieldId: { type: "integer" },
        defaultSortOrder: { type: "string", enum: ["ASC", "DESC"] },
        description: { type: "string" },
        id: { type: "string" },
        keyFieldId: { type: "integer" },
        name: { type: "string" },
        nextFieldId: { type: "integer" },
        nextRecordId: { type: "integer" },
        pluralRecordName: { type: "string" },
        singleRecordName: { type: "string" },
        sizeLimit: { type: "string" },
        spaceRemaining: { type: "string" },
        spaceUsed: { type: "string" },
        updated: { type: "string" },
      },
    };
    spec.definitions.App = {
      type: "object",
      properties: {
        created: { type: "string" },
        dateFormat: { type: "string" },
        description: { type: "string" },
        hasEveryoneOnTheInternet: { type: "boolean" },
        id: { type: "string" },
        memoryInfo: {
          type: "object",
          properties: {
            estMemory: { type: "integer" },
            estMemoryInclDependentApps: { type: "integer" },
          },
        },
        name: { type: "string" },
        securityProperties: {
          type: "object",
          additionalProperties: { type: "boolean" },
        },
        timeZone: { type: "string" },
        updated: { type: "string" },
      },
    };
    spec.definitions.Record = {
      type: "object",
      properties: {
        metadata: {
          type: "object",
          properties: {
            createdRecordId: { type: "integer" },
            updatedRecordId: { type: "integer" },
            lineErrors: { type: "array", items: { type: "string" } },
          },
        },
        data: { type: "object", additionalProperties: true },
      },
    };
    spec.definitions.RecordRequest = {
      type: "object",
      properties: {
        to: { type: "string" },
        data: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
      },
    };
    spec.definitions.ReportData = {
      type: "object",
      properties: {
        id: { type: "string" },
        data: {
          type: "array",
          items: { type: "object", additionalProperties: true },
        },
      },
    };

    console.log("Removing unexpected top-level attributes...");
    delete spec.operations;
    delete spec.groups;
    delete spec.components;

    console.log(`Writing fixed spec to ${path.basename(outputFile)}...`);
    await fs.writeFile(outputFile, JSON.stringify(spec, null, 2), "utf8");
    console.log("Spec fixed successfully!");
  } catch (error) {
    console.error("Failed to fix spec:", error);
    process.exit(1);
  }
}

fixQuickBaseSpec();
