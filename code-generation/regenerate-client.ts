#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODEGEN_DIR = __dirname;
const SPEC_FILE = join(CODEGEN_DIR, "quickbase-fixed.json");
const GENERATED_DIR = join(__dirname, "..", "src", "generated");
const BACKUP_DIR = join(__dirname, "..", "src", "generated-old");
const JAR_PATH = join(CODEGEN_DIR, "openapi-generator-cli.jar");

function backupGeneratedDir(): void {
  console.log("Backing up existing src/generated/...");
  if (existsSync(GENERATED_DIR)) {
    if (existsSync(BACKUP_DIR))
      execSync(`rm -rf ${BACKUP_DIR}`, { stdio: "inherit" });
    execSync(`mv ${GENERATED_DIR} ${BACKUP_DIR}`, { stdio: "inherit" });
    console.log(`Moved src/generated/ to ${basename(BACKUP_DIR)}`);
  } else {
    console.log("No existing src/generated/ to backup.");
  }
}

function generateClient(): void {
  if (!existsSync(SPEC_FILE)) {
    console.error(
      `Fixed spec file ${basename(SPEC_FILE)} not found. Run 'npm run fix-spec' first.`
    );
    process.exit(1);
  }
  console.log("Generating TypeScript client with models using JAR...");
  execSync(
    `java -jar ${JAR_PATH} generate \
      -i ${SPEC_FILE} \
      -g typescript-axios \
      -o ${GENERATED_DIR} \
      --skip-validate-spec \
      --additional-properties=supportsES6=true,modelPropertyNaming=original,withSeparateModelsAndApi=true,generateAliasAsModel=true,apiPackage=generated.api,modelPackage=generated.model`,
    { stdio: "inherit" }
  );
  console.log(`Client generated successfully in ${GENERATED_DIR}`);
}

function fixImports(): void {
  console.log("Fixing ESM imports in generated files...");
  const files = readdirSync(GENERATED_DIR).filter((f: string) =>
    f.endsWith(".ts")
  );
  for (const file of files) {
    const filePath = join(GENERATED_DIR, file);
    let content = readFileSync(filePath, "utf8");
    content = content.replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g, "$1$2.js$3");
    writeFileSync(filePath, content, "utf8");
  }
  console.log("Imports fixed.");
}

function main(): void {
  try {
    execSync("java -version", { stdio: "ignore" });
  } catch (error) {
    console.error(
      "Java is not installed or not in PATH. Install Java (e.g., OpenJDK 17)."
    );
    process.exit(1);
  }
  backupGeneratedDir();
  generateClient();
  fixImports();
}

main();
