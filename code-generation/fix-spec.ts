#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import * as glob from "glob";

// Define types for the spec structure (simplified for brevity)
interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: { type?: string; items?: any };
  example?: any;
}

interface Operation {
  parameters?: Parameter[];
  responses?: Record<string, { description: string; schema?: any }>;
}

interface Spec {
  paths: Record<string, Record<string, Operation>>;
  definitions?: Record<string, any>;
  operations?: any;
  groups?: any;
  components?: any;
}

async function fixQuickBaseSpec(): Promise<void> {
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
    const inputFile = specFiles.sort().pop() as string;
    const outputFile = path.join(CODEGEN_DIR, "quickbase-fixed.json");

    console.log(`Reading ${path.basename(inputFile)} from specs/...`);
    const specContent = await fs.readFile(inputFile, "utf8");
    const spec: Spec = JSON.parse(specContent);

    console.log("Fixing parameters...");
    for (const pathKey in spec.paths) {
      for (const method in spec.paths[pathKey]) {
        const operation = spec.paths[pathKey][method];
        if (operation.parameters) {
          operation.parameters = operation.parameters.map(
            (param: Parameter) => {
              if ("example" in param) delete param.example;
              if ("schema" in param && param.in !== "body") delete param.schema;
              if (!param.type && param.in !== "body") param.type = "string";
              if (
                param.name === "generated" &&
                param.schema?.type === "array" &&
                !param.schema.items
              ) {
                param.schema!.items = { $ref: "#/definitions/Record" };
              }
              return param;
            }
          );
        }
      }
    }

    console.log("Adding responses and schemas...");
    // Fix /fields endpoint
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

    // Fix /fields/{fieldId} endpoint (example)
    if (spec.paths["/fields/{fieldId}"]?.get) {
      spec.paths["/fields/{fieldId}"].get.responses = {
        200: {
          description: "Successful response",
          schema: { $ref: "#/definitions/Field" },
        },
      };
    }

    // Add /tables/{tableId} endpoint with Table definition
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

    // Fix /apps/{appId} endpoint (example)
    if (spec.paths["/apps/{appId}"]?.get) {
      spec.paths["/apps/{appId}"].get.responses = {
        200: {
          description: "Successful response",
          schema: { $ref: "#/definitions/App" },
        },
      };
    }

    // Add more endpoints as needed...

    console.log("Adding definitions...");
    if (!spec.definitions) spec.definitions = {};

    // Field definition (already present)
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

    // Add Table definition
    spec.definitions.Table = {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique identifier for the table" },
        name: { type: "string", description: "Name of the table" },
        created: {
          type: "string",
          format: "date-time",
          description: "Creation timestamp",
        },
        updated: {
          type: "string",
          format: "date-time",
          description: "Last updated timestamp",
        },
        description: { type: "string", description: "Table description" },
        keyFieldId: { type: "integer", description: "ID of the key field" },
        nextFieldId: {
          type: "integer",
          description: "Next available field ID",
        },
        nextRecordId: {
          type: "integer",
          description: "Next available record ID",
        },
        // Add more properties based on QuickBase API docs
      },
      required: ["id", "name"],
    };

    // Add App definition (example)
    spec.definitions.App = {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique identifier for the app" },
        name: { type: "string", description: "Name of the app" },
        created: { type: "string", format: "date-time" },
        updated: { type: "string", format: "date-time" },
        description: { type: "string" },
        // Add more properties as needed
      },
      required: ["id", "name"],
    };

    // Add more definitions as needed (e.g., Record, ReportData)...

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
