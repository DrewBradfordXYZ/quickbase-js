#!/usr/bin/env node

console.log("Script started");

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
console.log("FS modules imported");

import { join, dirname } from "path";
console.log("Path modules imported");

import { fileURLToPath } from "url";
console.log("URL module imported");

import { generateJsDoc } from "./utils/generateJsDoc.ts";
import {
  PropertyDetail,
  ParamDetail,
  JsDocOptions,
  mapOpenApiTypeToTs,
  mapRefToType,
  parseInterfaceProperties,
  parseOpenApiOperations,
} from "./utils/sharedUtils.ts";
import { writeFileSafe, runTask } from "./utils/common.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log("__dirname set:", __dirname);

const SPEC_FILE = join(__dirname, "output", "quickbase-fixed.json");
const OUTPUT_DIR = join(__dirname, "..", "src", "generated-unified");
const OUTPUT_FILE = join(OUTPUT_DIR, "QuickbaseClient.ts");
const MODELS_DIR = join(__dirname, "..", "src", "generated", "models");

function generateInterface(includeResponseProperties: boolean = false): void {
  console.log(
    "Generating interface with includeResponseProperties:",
    includeResponseProperties
  );

  console.log("Checking spec file:", SPEC_FILE);
  if (!existsSync(SPEC_FILE)) {
    console.error(
      `Spec file ${SPEC_FILE} not found. Run 'npm run fix-spec' first.`
    );
    process.exit(1);
  }

  console.log("Checking models directory:", MODELS_DIR);
  if (!existsSync(MODELS_DIR)) {
    console.error(
      `Models directory ${MODELS_DIR} not found. Run 'npm run gen:openapi' first.`
    );
    process.exit(1);
  }

  const { operations, modelImports, missingTypes } = parseOpenApiOperations(
    SPEC_FILE,
    MODELS_DIR
  );
  console.log("Operations parsed:", operations.length);

  const methods: string[] = operations.map((op) => {
    const params = op.parameters
      .map((p) => `${p.name}${p.required ? "" : "?"}: ${p.type}`)
      .join("; ");
    const jsDocOptions: JsDocOptions = {
      summary: op.summary,
      opId: op.name,
      paramDetails: op.parameters,
      returnType: op.returns,
      returnTypeDetails: includeResponseProperties
        ? op.returnTypeDetails || []
        : [],
      docLink: op.docLink,
    };
    const jsDoc = generateJsDoc(jsDocOptions);
    return `${jsDoc}\n  ${op.name}: (params: { ${params} }) => Promise<${op.returns}>;`;
  });

  console.log("Writing missing types report...");
  writeFileSafe(
    join(OUTPUT_DIR, "missing-types-report.json"),
    JSON.stringify({ missingTypes: Array.from(missingTypes) }, null, 2)
  );

  const importStatement =
    modelImports.size > 0
      ? `import { ${Array.from(modelImports)
          .sort()
          .join(", ")} } from "../generated/models";`
      : "";
  const interfaceContent = `// Generated on ${new Date().toISOString()}\n${importStatement}\n\nexport interface QuickbaseClient {\n${methods.join(
    "\n"
  )}\n}\n`;

  console.log("Ensuring output directory exists and writing interface...");
  writeFileSafe(OUTPUT_FILE, interfaceContent);
  console.log("Generated:", OUTPUT_FILE);
}

console.log("Entering runTask block");
runTask("generateInterface", () => generateInterface(true));

console.log("Script completed");
