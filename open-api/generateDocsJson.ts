#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseOpenApiOperations } from "./utils/sharedUtils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_FILE = join(__dirname, "output", "quickbase-fixed.json");
const MODELS_DIR = join(__dirname, "..", "src", "generated", "models");
const DOCS_DATA_DIR = join(__dirname, "..", "docs-data");
const DOCS_JSON_FILE = join(DOCS_DATA_DIR, "api-docs.json");

function generateDocsJson(): void {
  console.log("Generating docs JSON...");

  const { operations } = parseOpenApiOperations(SPEC_FILE, MODELS_DIR);

  if (!existsSync(DOCS_DATA_DIR)) {
    mkdirSync(DOCS_DATA_DIR, { recursive: true });
  }
  writeFileSync(DOCS_JSON_FILE, JSON.stringify(operations, null, 2), "utf8");
  console.log("Generated docs JSON:", DOCS_JSON_FILE);
}

try {
  generateDocsJson();
} catch (error) {
  console.error("Error in generateDocsJson:", error);
  process.exit(1);
}

console.log("Script completed");
