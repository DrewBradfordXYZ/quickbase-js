// tools/validate-spec.ts
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as glob from "glob";
import OpenAPISchemaValidatorModule from "openapi-schema-validator";

const OpenAPISchemaValidator = OpenAPISchemaValidatorModule.default;

async function validateSpecs(): Promise<void> {
  const CODEGEN_DIR = path.dirname(fileURLToPath(import.meta.url));
  const SPLIT_DIR = path.join(CODEGEN_DIR, "..", "specs", "split");

  const specFiles = glob.sync(path.join(SPLIT_DIR, "*.json"));
  if (specFiles.length === 0) {
    console.error("No split spec files found in specs/split/ folder.");
    process.exit(1);
  }

  const validator = new OpenAPISchemaValidator({ version: 2 });

  for (const specFile of specFiles) {
    console.log(`Validating ${path.basename(specFile)}...`);
    const specContent = await fs.readFile(specFile, "utf8");
    const spec = JSON.parse(specContent);

    const result = validator.validate(spec);
    if (result.errors.length > 0) {
      console.error(`Validation errors in ${specFile}:`, result.errors);
      process.exit(1);
    } else {
      console.log(`${specFile} is valid.`);
    }
  }
}

validateSpecs().catch((error) => {
  console.error("Failed to validate specs:", error);
  process.exit(1);
});
