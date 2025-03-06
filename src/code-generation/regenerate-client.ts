#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { Project } from "ts-morph";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CODEGEN_DIR = __dirname;
const SPEC_FILE = join(CODEGEN_DIR, "quickbase-fixed.json");
const GENERATED_DIR = join(__dirname, "..", "generated");
const BACKUP_DIR = join(__dirname, "..", "generated-old");
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
      `Fixed spec file ${basename(
        SPEC_FILE
      )} not found. Run 'npm run fix-spec' first.`
    );
    process.exit(1);
  }
  console.log("Generating TypeScript client with Fetch API using JAR...");
  const command = `java -jar ${JAR_PATH} generate \
    -i ${SPEC_FILE} \
    -g typescript-fetch \
    -o ${GENERATED_DIR} \
    --skip-validate-spec \
    --additional-properties=supportsES6=true,modelPropertyNaming=original,typescriptThreePlus=true,apiPackage=apis,modelPackage=models`;
  console.log("Executing command:", command);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`Client generated successfully in ${GENERATED_DIR}`);
    console.log(
      "Generated APIs:",
      execSync(
        `ls ${GENERATED_DIR}/apis/ || echo "No APIs generated"`
      ).toString()
    );
    console.log(
      "Checking for getAppById:",
      execSync(
        `grep "getAppById" ${GENERATED_DIR}/apis/AppsApi.ts || echo "Not found"`
      ).toString()
    );
  } catch (error) {
    console.error("Generation failed:", error.message);
    process.exit(1);
  }
}

function fixImportsAndExports(): void {
  console.log(
    "Fixing ESM imports and exports in generated files to use .ts extensions..."
  );
  const project = new Project({
    tsConfigFilePath: join(__dirname, "../../tsconfig.json"),
  });
  project.addSourceFilesAtPaths(`${GENERATED_DIR}/**/*.ts`);
  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    console.log(`Processing ${basename(filePath)}`);
    const imports = sourceFile.getImportDeclarations();
    const exports = sourceFile.getExportDeclarations();

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (
        moduleSpecifier.startsWith("./") ||
        moduleSpecifier.startsWith("../")
      ) {
        if (!moduleSpecifier.endsWith(".ts")) {
          importDecl.setModuleSpecifier(`${moduleSpecifier}.ts`);
          console.log(
            `Updated import: ${moduleSpecifier} -> ${moduleSpecifier}.ts`
          );
        }
      }
    }

    for (const exportDecl of exports) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (
        moduleSpecifier &&
        (moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../"))
      ) {
        if (!moduleSpecifier.endsWith(".ts")) {
          exportDecl.setModuleSpecifier(`${moduleSpecifier}.ts`);
          console.log(
            `Updated export: ${moduleSpecifier} -> ${moduleSpecifier}.ts`
          );
        }
      }
    }
    sourceFile.saveSync();
  }
  console.log("All imports and exports fixed with .ts extensions.");
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
  fixImportsAndExports();
}

main();
