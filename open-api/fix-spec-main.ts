#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as glob from "glob";

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: {
    type?: string;
    items?: any;
    $ref?: string;
    properties?: any;
    example?: any;
  };
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
  swagger: string;
  info: any;
  operations?: any;
  groups?: any;
  components?: any;
}

interface FixSpecConfig {
  applyOverrides?: boolean;
  overridePaths?: string[];
  overrideDefinitions?: string[];
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^./, (str) => str.toLowerCase());
}

function fixArraySchemas(spec: Spec) {
  // Fix arrays in paths
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation = spec.paths[pathKey][method];
      if (operation.parameters) {
        operation.parameters.forEach((param: Parameter) => {
          if (param.schema?.type === "array" && !param.schema.items) {
            console.log(
              `Fixing array schema for ${pathKey}(${method}).${param.name}`
            );
            param.schema.items =
              pathKey === "/records" && param.name === "generated"
                ? { $ref: "#/definitions/Record" }
                : { type: "string" };
          }
          if (param.schema?.properties) {
            for (const propKey in param.schema.properties) {
              const prop = param.schema.properties[propKey];
              if (prop.type === "array" && !prop.items) {
                console.log(
                  `Fixing nested array for ${pathKey}(${method}).${param.name}.${propKey}`
                );
                prop.items =
                  propKey === "data" && pathKey === "/records"
                    ? { $ref: "#/definitions/Record" }
                    : { type: "string" };
              }
            }
          }
        });
      }
      if (operation.responses) {
        for (const status in operation.responses) {
          const response = operation.responses[status];
          if (response.schema?.type === "array" && !response.schema.items) {
            console.log(
              `Fixing array schema for ${pathKey}(${method}).responses.${status}`
            );
            response.schema.items =
              pathKey === "/records"
                ? { $ref: "#/definitions/Upsert200Response" }
                : { type: "string" };
          }
          if (response.schema?.properties) {
            for (const propKey in response.schema.properties) {
              const prop = response.schema.properties[propKey];
              if (prop.type === "array" && !prop.items) {
                console.log(
                  `Fixing nested array for ${pathKey}(${method}).responses.${status}.${propKey}`
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

  // Fix arrays in definitions
  console.log("Fixing array schemas in definitions...");
  const definitions = spec.definitions || {};

  for (const defKey in definitions) {
    const def = definitions[defKey];
    if (def.properties) {
      for (const propKey in def.properties) {
        const prop = def.properties[propKey];
        if (prop.type === "array" && !prop.items) {
          console.log(`Fixing missing items in ${defKey}.${propKey}`);
          if (defKey === "runQueryRequest" && propKey === "select") {
            prop.items = { type: "integer" }; // Field IDs
          } else if (propKey === "data") {
            prop.items = { $ref: "#/definitions/Record" }; // Data arrays
          } else {
            prop.items = { type: "string" }; // Fallback
          }
        }
        if (prop["x-amf-union"]) {
          prop["x-amf-union"].forEach((unionType: any) => {
            if (unionType.type === "array" && !unionType.items) {
              console.log(`Fixing union array in ${defKey}.${propKey}`);
              unionType.items = { type: "object" }; // Default for sortBy-like structures
            }
          });
        }
      }
    }
  }
}
function enhanceRawSpec(spec: Spec) {
  spec.definitions = spec.definitions || {};

  // Define FieldValue and FieldMap
  spec.definitions["FieldValue"] = {
    type: "object",
    description: "A value for a QuickBase field.",
    properties: {
      value: {
        anyOf: [
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
          { type: "object" },
          { type: "array", items: { type: "string" } },
        ],
      },
    },
    required: ["value"],
  };

  spec.definitions["FieldMap"] = {
    type: "object",
    description: "A mapping of field IDs to their values.",
    additionalProperties: { $ref: "#/definitions/FieldValue" },
  };

  // Define Record if not present (basic structure for data arrays)
  if (!spec.definitions["Record"]) {
    spec.definitions["Record"] = {
      type: "object",
      description: "A generic QuickBase record.",
      additionalProperties: { $ref: "#/definitions/FieldValue" },
    };
    console.log("Added Record to definitions");
  }

  // Enhance operations
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation = spec.paths[pathKey][method];
      const opId =
        operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;

      if (operation.parameters) {
        operation.parameters.forEach((param: Parameter) => {
          if (
            !param.type &&
            !param.schema &&
            (param.in === "path" || param.in === "query")
          ) {
            param.type = param.name.includes("Id") ? "string" : "string";
            console.log(
              `Set default type 'string' for ${pathKey}(${method}).${param.name}`
            );
          }
          if (param.in === "body" && param.schema) {
            const requestName = `${opId}Request`;
            if (!param.schema.type) {
              param.schema.type = "string";
              console.log(
                `Set schema type to 'string' for ${pathKey}(${method}).${param.name}`
              );
            }
            spec.definitions[requestName] = param.schema;
            param.schema = { $ref: `#/definitions/${requestName}` };
            console.log(
              `Added ${requestName} to definitions for ${pathKey}(${method})`
            );
          }
        });
      }

      if (operation.responses) {
        for (const status in operation.responses) {
          const response = operation.responses[status];
          if (response.schema) {
            const cleanStatus = status.replace("/", "_");
            const responseName = `${opId}${cleanStatus}Response`;
            spec.definitions[responseName] = response.schema;
            response.schema = { $ref: `#/definitions/${responseName}` };
            console.log(
              `Added ${responseName} to definitions for ${pathKey}(${method})`
            );
          }
        }
      }
    }
  }

  console.log("Fixing array schemas...");
  fixArraySchemas(spec);

  console.log("Removing unexpected top-level attributes...");
  delete spec.operations;
  delete spec.groups;
  delete spec.components;
}

async function fixQuickBaseSpec(config: FixSpecConfig = {}): Promise<void> {
  try {
    const CODEGEN_DIR = path.dirname(fileURLToPath(import.meta.url));
    const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs");
    const OUTPUT_DIR = path.join(CODEGEN_DIR, "output");
    console.log("Finding latest QuickBase RESTful API spec...");
    const specFiles = glob.sync(
      path.join(SPECS_DIR, "QuickBase_RESTful_*.json")
    );
    if (specFiles.length === 0) {
      throw new Error(
        "No QuickBase_RESTful_*.json files found in specs/ folder."
      );
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
              if (!param.type && param.in !== "body") {
                param.type = param.name.includes("Id") ? "string" : "string";
                console.log(
                  `Set default type 'string' for ${pathKey}(${method}).${param.name} in initial pass`
                );
              }
              return param;
            });
        }
      }
    }

    console.log("Enhancing raw spec...");
    enhanceRawSpec(spec);

    console.log(`Writing fixed spec to ${path.basename(outputFile)}...`);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(outputFile, JSON.stringify(spec, null, 2), "utf8");
    console.log("Spec fixed successfully! Output written to:", outputFile);
  } catch (error) {
    console.error("Failed to fix spec:", error);
    process.exit(1);
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    let config: FixSpecConfig = {};

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--config" && i + 1 < args.length) {
        config = JSON.parse(args[i + 1]);
        i++;
      }
    }

    await fixQuickBaseSpec(config);
  } catch (error) {
    console.error("Fatal error in script execution:", error);
    process.exit(1);
  }
}

main();
