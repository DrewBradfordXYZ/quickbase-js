#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import * as glob from "glob";
import { paths } from "./fix-spec-paths.ts";
import { definitions } from "./fix-spec-definitions.ts";

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: { type?: string; items?: any; $ref?: string };
  example?: any;
}

interface Operation {
  parameters?: Parameter[];
  responses?: Record<string, { description: string; schema?: any }>;
  operationId?: string;
  summary?: string;
  tags?: string[];
}

interface Spec {
  paths: Record<string, Record<string, Operation>>;
  definitions?: Record<string, any>;
  operations?: any;
  groups?: any;
  components?: any;
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^./, (str) => str.toLowerCase());
}

function fixArraySchemas(spec: Spec) {
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation = spec.paths[pathKey][method];
      if (operation.parameters) {
        operation.parameters.forEach((param: Parameter) => {
          if (param.schema?.type === "array" && !param.schema.items) {
            console.log(
              `Fixing missing items in ${pathKey}(${method}).${param.name}`
            );
            param.schema.items = { type: "string" }; // Default fallback
          }
        });
      }
      if (operation.responses) {
        for (const status in operation.responses) {
          const response = operation.responses[status];
          if (response.schema?.type === "array" && !response.schema.items) {
            console.log(
              `Fixing missing items in ${pathKey}(${method}).responses.${status}`
            );
            response.schema.items = { type: "string" }; // Default fallback
          }
        }
      }
    }
  }
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
          operation.parameters = operation.parameters
            .filter(
              (param) =>
                !["QB-Realm-Hostname", "Authorization", "User-Agent"].includes(
                  param.name
                )
            )
            .map((param: Parameter) => {
              param.name = toCamelCase(param.name);
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
            });
        }
      }
    }

    console.log("Applying endpoint fixes...");
    spec.paths = { ...paths }; // Fully replace paths with custom ones

    console.log("Fixing array schemas...");
    fixArraySchemas(spec); // Fix any remaining arrays

    console.log("Applying definitions...");
    spec.definitions = definitions;

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
