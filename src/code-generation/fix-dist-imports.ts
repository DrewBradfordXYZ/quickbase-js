#!/usr/bin/env node
import { Project } from "ts-morph";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, "..", "..", "dist");

function fixDistImports() {
  console.log("Fixing imports in dist/ to use .js extensions...");
  const project = new Project({
    tsConfigFilePath: join(__dirname, "../../tsconfig.build.json"),
  });
  project.addSourceFilesAtPaths(`${DIST_DIR}/**/*.js`);
  project.addSourceFilesAtPaths(`${DIST_DIR}/**/*.d.ts`);
  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    console.log(`Processing ${filePath}`);
    const imports = sourceFile.getImportDeclarations();
    const exports = sourceFile.getExportDeclarations();

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (
        (moduleSpecifier.startsWith("./") ||
          moduleSpecifier.startsWith("../")) &&
        moduleSpecifier.endsWith(".ts")
      ) {
        importDecl.setModuleSpecifier(moduleSpecifier.replace(".ts", ".js"));
      }
    }

    for (const exportDecl of exports) {
      const moduleSpecifier = exportDecl.getModuleSpecifierValue();
      if (
        moduleSpecifier &&
        (moduleSpecifier.startsWith("./") ||
          moduleSpecifier.startsWith("../")) &&
        moduleSpecifier.endsWith(".ts")
      ) {
        exportDecl.setModuleSpecifier(moduleSpecifier.replace(".ts", ".js"));
      }
    }
    sourceFile.saveSync();
  }
  console.log("Dist imports fixed.");
}

try {
  fixDistImports();
} catch (error) {
  console.error("Failed to fix dist imports:", error);
  process.exit(1);
}
