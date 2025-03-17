#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as glob from "glob";
import { Spec } from "./types/spec.ts";
import { toCamelCase } from "./utils/naming.ts";

async function fixQuickBaseSpec(): Promise<void> {
  const CODEGEN_DIR = path.dirname(fileURLToPath(import.meta.url));
  const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs");
  const OUTPUT_DIR = path.join(CODEGEN_DIR, "output");
  console.log("Finding latest QuickBase RESTful API spec...");
  const specFiles = glob.sync(path.join(SPECS_DIR, "QuickBase_RESTful_*.json"));
  console.log("Spec files:", specFiles);

  if (specFiles.length === 0) {
    throw new Error(
      "No QuickBase_RESTful_*.json files found in specs/ folder."
    );
  }

  const inputFile = specFiles.sort().pop() as string;
  const outputFile = path.join(OUTPUT_DIR, "quickbase-fixed.json");

  console.log(`Reading ${path.basename(inputFile)} from specs/...`);
  const specContent = await fs.readFile(inputFile, "utf8");
  console.log("File read successfully");
  const spec: Spec = JSON.parse(specContent);
  console.log("JSON parsed successfully");

  if (!spec.definitions || typeof spec.definitions !== "object") {
    spec.definitions = {};
  }
  console.log("Spec definitions after initialization:", spec.definitions);

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
          .map((param) => {
            param.name = toCamelCase(param.name);
            if ("example" in param) delete param.example;
            if ("schema" in param && param.in !== "body") delete param.schema;
            if (!param.type && param.in !== "body") {
              param.type = param.name.includes("Id") ? "string" : "string";
              console.log(
                `Set default type 'string' for ${pathKey}(${method}).${param.name}`
              );
            }
            return param;
          });
      }
    }
  }

  console.log("Spec definitions before enhanceTags:", spec.definitions);
  console.log("Enhancing raw spec with tags...");
  const { enhanceTags } = await import("./schema/tags/index.ts"); // Updated to index.ts
  enhanceTags(spec);
  console.log("Enhancing raw spec with general enhancements...");
  const { enhanceGeneral } = await import("./schema/enhance-general.ts");
  enhanceGeneral(spec);
  console.log("Fixing array schemas...");
  const { fixArrays } = await import("./schema/fix-arrays.ts");
  fixArrays(spec);

  console.log("Removing unexpected top-level attributes...");
  delete spec.operations;
  delete spec.groups;
  delete spec.components;

  console.log(`Writing fixed spec to ${path.basename(outputFile)}...`);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(outputFile, JSON.stringify(spec, null, 2), "utf8");
  console.log("Spec fixed successfully! Output written to:", outputFile);
}

async function main() {
  try {
    console.log("Starting...");
    await fixQuickBaseSpec();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
