// tools/generate-types.ts
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as glob from "glob";
import { execSync } from "child_process";

async function generateTypes(): Promise<void> {
  const CODEGEN_DIR = path.dirname(fileURLToPath(import.meta.url));
  const SPLIT_DIR = path.join(CODEGEN_DIR, "..", "specs", "split");
  const OUTPUT_DIR = path.join(CODEGEN_DIR, "..", "src", "generated-types");

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const specFiles = glob.sync(path.join(SPLIT_DIR, "*.json"));
  for (const specFile of specFiles) {
    const category = path.basename(specFile, ".json");
    const outputFile = path.join(OUTPUT_DIR, `${category}.ts`);
    console.log(`Generating types for ${category}...`);
    execSync(`npx openapi-typescript ${specFile} --output ${outputFile}`, {
      stdio: "inherit",
    });
  }
}

generateTypes().catch((error) => {
  console.error("Failed to generate types:", error);
  process.exit(1);
});
