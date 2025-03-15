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
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation = spec.paths[pathKey][method];
      if (operation.parameters) {
        operation.parameters.forEach((param: Parameter) => {
          if (param.schema?.type === "array" && !param.schema.items) {
            console.log(
              `Fixing array schema for ${pathKey}(${method}).${param.name}`
            );
            param.schema.items = { type: "string" };
          }
          if (param.schema?.properties) {
            for (const propKey in param.schema.properties) {
              const prop = param.schema.properties[propKey];
              if (prop.type === "array" && !prop.items) {
                console.log(
                  `Fixing nested array for ${pathKey}(${method}).${param.name}.${propKey}`
                );
                prop.items = { type: "string" };
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
            response.schema.items = { type: "string" };
          }
          if (response.schema?.properties) {
            for (const propKey in response.schema.properties) {
              const prop = response.schema.properties[propKey];
              if (prop.type === "array" && !prop.items) {
                console.log(
                  `Fixing nested array for ${pathKey}(${method}).responses.${status}.${propKey}`
                );
                prop.items = { type: "string" };
              }
            }
          }
        }
      }
    }
  }

  console.log("Fixing array schemas in definitions...");
  const definitions = spec.definitions || {};

  for (const defKey in definitions) {
    const def = definitions[defKey];
    if (def.properties) {
      for (const propKey in def.properties) {
        const prop = def.properties[propKey];
        if (prop.type === "array" && !prop.items) {
          console.log(`Fixing missing items in ${defKey}.${propKey}`);
          prop.items = { type: "string" };
        }
      }
    }
  }
}

function enhanceRawSpec(spec: Spec) {
  spec.definitions = spec.definitions || {};

  // Define Record if not present
  if (!spec.definitions["Record"]) {
    spec.definitions["Record"] = {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          value: { type: "string" }, // Generic field value, can be refined later
        },
        required: ["value"],
      },
      description: "A generic QuickBase record with field ID-value pairs",
    };
    console.log("Added Record to definitions");
  }

  // Normalize definition names to camelCase
  const normalizeDefinitionName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation = spec.paths[pathKey][method];
      const opId =
        operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;

      if (operation.parameters) {
        operation.parameters.forEach((param: Parameter) => {
          if (param.in === "body") {
            if (!param.schema) {
              param.schema = {};
            }
            let requestName =
              param.schema.$ref?.split("/").pop() || `${opId}Request`;
            requestName = normalizeDefinitionName(requestName);

            if (spec.definitions[requestName]?.type === "array") {
              console.log(
                `Wrapping array schema for ${requestName} in ${pathKey}(${method})`
              );
              const arraySchema = spec.definitions[requestName];
              let wrapperPropName = operation.tags?.includes("Users")
                ? "userIds"
                : "items";
              if (
                operation.tags?.includes("Groups") &&
                operation.summary?.toLowerCase().includes("subgroup")
              ) {
                wrapperPropName = "groupIds";
              }
              spec.definitions[requestName] = {
                type: "object",
                properties: {
                  [wrapperPropName]: arraySchema,
                },
                required: arraySchema.minItems > 0 ? [wrapperPropName] : [],
                description:
                  arraySchema.description || `Request body for ${opId}`,
              };
            } else {
              let properties = spec.definitions[requestName]?.properties || {};
              if (
                !spec.definitions[requestName] ||
                !spec.definitions[requestName].type ||
                Object.keys(properties).length === 0
              ) {
                console.log(
                  `Defining schema for ${requestName} in ${pathKey}(${method})`
                );
                if (operation.tags?.includes("Users")) {
                  properties = {
                    userIds: { type: "array", items: { type: "string" } },
                  };
                } else if (
                  operation.tags?.includes("Groups") &&
                  operation.summary?.toLowerCase().includes("subgroup")
                ) {
                  properties = {
                    groupIds: { type: "array", items: { type: "string" } },
                  };
                } else if (
                  operation.tags?.includes("Records") &&
                  method === "post"
                ) {
                  properties = {
                    data: {
                      type: "array",
                      items: { $ref: "#/definitions/Record" },
                    },
                    to: { type: "string" },
                    fieldsToReturn: {
                      type: "array",
                      items: { type: "integer" },
                    },
                  };
                } else if (
                  operation.tags?.includes("Records") &&
                  method === "delete"
                ) {
                  properties = {
                    from: { type: "string" },
                    where: { type: "string" },
                  };
                } else if (
                  operation.tags?.includes("Records") &&
                  operation.summary?.toLowerCase().includes("query")
                ) {
                  properties = {
                    from: { type: "string" },
                    select: { type: "array", items: { type: "integer" } },
                    where: { type: "string" },
                  };
                } else if (operation.tags?.includes("Formulas")) {
                  properties = { formula: { type: "string" } };
                } else if (
                  operation.tags?.includes("Apps") ||
                  operation.tags?.includes("Tables")
                ) {
                  properties = { name: { type: "string" } };
                } else if (operation.tags?.includes("Fields")) {
                  properties =
                    method === "delete"
                      ? {
                          fieldIds: {
                            type: "array",
                            items: { type: "integer" },
                          },
                        }
                      : {
                          label: { type: "string" },
                          fieldType: { type: "string" },
                        };
                } else if (operation.tags?.includes("Reports")) {
                  properties = {
                    filters: { type: "array", items: { type: "object" } },
                  };
                } else if (operation.tags?.includes("Auth")) {
                  properties = { token: { type: "string" } };
                } else if (operation.tags?.includes("UserToken")) {
                  properties = operation.summary
                    ?.toLowerCase()
                    .includes("transfer")
                    ? {
                        userToken: { type: "string" },
                        toUserId: { type: "string" },
                      }
                    : { userToken: { type: "string" } };
                } else if (operation.tags?.includes("Audit")) {
                  properties = {
                    events: { type: "array", items: { type: "object" } },
                  };
                } else if (operation.tags?.includes("Analytics")) {
                  properties = {
                    where: { type: "array", items: { type: "object" } },
                  };
                } else if (operation.tags?.includes("Solutions")) {
                  properties = { name: { type: "string" } };
                } else {
                  properties = {
                    items: { type: "array", items: { type: "string" } },
                  };
                }
                spec.definitions[requestName] = {
                  type: "object",
                  properties,
                  required: Object.keys(properties).filter(
                    (key) => key !== "fieldsToReturn"
                  ),
                  description: operation.summary || `Request body for ${opId}`,
                };
              }
            }
            param.schema = { $ref: `#/definitions/${requestName}` };
            console.log(
              `Ensured ${requestName} in definitions for ${pathKey}(${method})`
            );
          } else if (
            !param.type &&
            !param.schema &&
            (param.in === "path" || param.in === "query")
          ) {
            param.type = param.name.includes("Id") ? "string" : "string";
            console.log(
              `Set default type 'string' for ${pathKey}(${method}).${param.name}`
            );
          }
        });
      }

      if (operation.responses) {
        for (const status in operation.responses) {
          const response = operation.responses[status];
          if (response.schema) {
            const cleanStatus = status.replace("/", "_");
            const responseName = normalizeDefinitionName(
              `${opId}${cleanStatus}Response`
            );
            if (!spec.definitions[responseName]) {
              console.log(
                `Adding ${responseName} to definitions for ${pathKey}(${method})`
              );
              spec.definitions[responseName] = response.schema;
            }
            response.schema = { $ref: `#/definitions/${responseName}` };
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

    if (!config.applyOverrides) {
      console.log("Running with no overrides, using raw spec only...");
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
