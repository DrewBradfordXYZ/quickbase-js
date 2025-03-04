#!/usr/bin/env node
const fs = require("fs").promises;
const path = require("path");
const glob = require("glob");

async function fixQuickBaseSpec() {
  try {
    const CODEGEN_DIR = __dirname; // code-generation folder
    const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs"); // Up to specs/
    console.log("Finding latest QuickBase RESTful API spec...");
    const specFiles = glob.sync(
      path.join(SPECS_DIR, "QuickBase_RESTful_*.json")
    );
    if (specFiles.length === 0) {
      console.error(
        "No QuickBase_RESTful_*.json files found in specs/ folder. Please download from QuickBase."
      );
      process.exit(1);
    }
    // Sort by filename (latest timestamp last)
    const inputFile = specFiles.sort().pop(); // Take the last (latest) file
    const outputFile = path.join(CODEGEN_DIR, "quickbase-fixed.json");

    console.log(`Reading ${path.basename(inputFile)} from specs/...`);
    const specContent = await fs.readFile(inputFile, "utf8");
    const spec = JSON.parse(specContent);

    // Fix 1: Remove 'example' from all parameters
    console.log("Removing 'example' from all parameters...");
    for (const path in spec.paths) {
      for (const method in spec.paths[path]) {
        const operation = spec.paths[path][method];
        if (operation.parameters) {
          operation.parameters = operation.parameters.map((param) => {
            if ("example" in param) delete param.example; // Remove from header, query, path
            if ("schema" in param && param.in !== "body") delete param.schema; // Remove unexpected schema
            if (!param.type && param.in !== "body") param.type = "string"; // Add missing type
            return param;
          });
        }
      }
    }

    // Fix 2: Add 'items' to all array responses missing them
    console.log("Adding missing 'items' to array responses...");
    function fixArraySchemas(obj) {
      if (!obj || typeof obj !== "object") return;
      for (const key in obj) {
        if (obj[key] && obj[key].type === "array" && !obj[key].items) {
          obj[key].items = {
            type: "object",
            properties: {
              metadata: {
                type: "object",
                properties: {
                  createdRecordId: {
                    type: "integer",
                    description: "Created record ID",
                  },
                  updatedRecordId: {
                    type: "integer",
                    description: "Updated record ID",
                  },
                  lineErrors: {
                    type: "array",
                    items: { type: "string" },
                    description: "Errors",
                  },
                },
              },
              data: {
                type: "object",
                additionalProperties: true,
                description: "Record data",
              },
            },
          };
        }
        fixArraySchemas(obj[key]); // Recurse into nested objects
      }
    }
    fixArraySchemas(spec.paths);

    // Fix 3: Remove unexpected top-level attributes
    console.log("Removing unexpected top-level attributes...");
    delete spec.operations;
    delete spec.groups;

    // Write fixed spec
    console.log(
      `Writing fixed spec to ${path.basename(
        outputFile
      )} in code-generation/...`
    );
    await fs.writeFile(outputFile, JSON.stringify(spec, null, 2), "utf8");
    console.log("Spec fixed successfully!");
  } catch (error) {
    console.error("Failed to fix spec:", error);
    process.exit(1);
  }
}

fixQuickBaseSpec();
