#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CODEGEN_DIR = __dirname; // code-generation folder
const SPEC_FILE = path.join(CODEGEN_DIR, "quickbase-fixed.json");
const GENERATED_DIR = path.join(__dirname, "..", "src", "generated"); // Up to src/
const BACKUP_DIR = path.join(__dirname, "..", "src", "generated-old");

function backupGeneratedDir() {
  console.log("Backing up existing src/generated/...");
  if (fs.existsSync(GENERATED_DIR)) {
    if (fs.existsSync(BACKUP_DIR))
      execSync(`rm -rf ${BACKUP_DIR}`, { stdio: "inherit" });
    execSync(`mv ${GENERATED_DIR} ${BACKUP_DIR}`, { stdio: "inherit" });
    console.log(`Moved src/generated/ to ${path.basename(BACKUP_DIR)}`);
  } else {
    console.log("No existing src/generated/ to backup.");
  }
}

function generateClient() {
  if (!fs.existsSync(SPEC_FILE)) {
    console.error(
      `Fixed spec file ${path.basename(
        SPEC_FILE
      )} not found in code-generation folder. Run 'npm run fix-spec' first.`
    );
    process.exit(1);
  }
  console.log("Generating TypeScript client...");
  execSync(
    `npx @openapitools/openapi-generator-cli generate \
      -i ${SPEC_FILE} \
      -g typescript-axios \
      -o ${GENERATED_DIR} \
      --additional-properties=supportsES6=true,modelPropertyNaming=original`,
    { stdio: "inherit" }
  );
  console.log(`Client generated successfully in ${GENERATED_DIR}`);
}

function main() {
  try {
    execSync("java -version", { stdio: "ignore" });
  } catch (error) {
    console.error(
      "Java is not installed or not in PATH. Please install Java (e.g., OpenJDK 17)."
    );
    process.exit(1);
  }
  backupGeneratedDir();
  generateClient();
}

main();
