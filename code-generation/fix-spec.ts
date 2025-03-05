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
    // ... (rest of the paths logic remains unchanged, just typed)

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
    // ... (rest of the definitions remain unchanged)

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
