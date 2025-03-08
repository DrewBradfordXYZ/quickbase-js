#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as glob from "glob";
import { paths } from "./fix-spec-paths.ts";
import { definitions } from "./fix-spec-definitions.ts";

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: { type?: string; items?: any; $ref?: string; properties?: any };
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
          if (param.schema) {
            if (param.schema.type === "array" && !param.schema.items) {
              console.log(
                `Fixing missing items in ${pathKey}(${method}).${param.name}`
              );
              param.schema.items =
                pathKey === "/records" && param.name === "generated"
                  ? { $ref: "#/definitions/Record" }
                  : { type: "string" };
            }
            if (param.schema.properties) {
              for (const propKey in param.schema.properties) {
                const prop = param.schema.properties[propKey];
                if (prop.type === "array" && !prop.items) {
                  console.log(
                    `Fixing nested array in ${pathKey}(${method}).${param.name}.${propKey}`
                  );
                  prop.items =
                    propKey === "data" && pathKey === "/records"
                      ? { $ref: "#/definitions/Record" }
                      : { type: "string" };
                }
              }
            }
          }
        });
      }
      if (operation.responses) {
        for (const status in operation.responses) {
          const response = operation.responses[status];
          if (response.schema) {
            if (response.schema.type === "array" && !response.schema.items) {
              console.log(
                `Fixing missing items in ${pathKey}(${method}).responses.${status}`
              );
              response.schema.items =
                pathKey === "/records"
                  ? { $ref: "#/definitions/Upsert200Response" }
                  : { type: "string" };
            }
            if (response.schema.properties) {
              for (const propKey in response.schema.properties) {
                const prop = response.schema.properties[propKey];
                if (prop.type === "array" && !prop.items) {
                  console.log(
                    `Fixing nested array in ${pathKey}(${method}).responses.${status}.${propKey}`
                  );
                  prop.items =
                    propKey === "data" && pathKey === "/records"
                      ? { $ref: "#/definitions/Upsert200Response" }
                      : { type: "string" };
                }
              }
            }
          }
        }
      }
    }
  }
}

async function fixQuickBaseSpec(): Promise<void> {
  try {
    const CODEGEN_DIR = path.dirname(fileURLToPath(import.meta.url));
    const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs");
    const OUTPUT_DIR = path.join(CODEGEN_DIR, "output");
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
    const outputFile = path.join(OUTPUT_DIR, "quickbase-fixed.json");

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
              return param;
            });
        }
      }
    }

    console.log("Applying endpoint fixes...");
    spec.paths = { ...spec.paths, ...paths }; // Merge original and custom paths

    console.log("Fixing array schemas...");
    fixArraySchemas(spec);

    console.log("Applying definitions...");
    spec.definitions = { ...spec.definitions, ...definitions }; // Merge definitions

    console.log("Removing unexpected top-level attributes...");
    delete spec.operations;
    delete spec.groups;
    delete spec.components;

    console.log(`Writing fixed spec to ${path.basename(outputFile)}...`);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(outputFile, JSON.stringify(spec, null, 2), "utf8");
    console.log("Spec fixed successfully!");
  } catch (error) {
    console.error("Failed to fix spec:", error);
    process.exit(1);
  }
}

fixQuickBaseSpec();
