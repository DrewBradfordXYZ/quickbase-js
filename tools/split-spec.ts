// tools/split-spec.ts
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as glob from "glob";

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: any;
  example?: any;
  description?: string;
}

interface Operation {
  parameters?: Parameter[];
}

interface Spec {
  swagger?: string;
  openapi?: string;
  info: any;
  paths: Record<string, Record<string, Operation>>;
  definitions?: Record<string, any>;
}

function normalizeParameters(parameters: Parameter[] = []): Parameter[] {
  return parameters.map((param) => {
    const normalized: Parameter = {
      name: param.name,
      in: param.in,
      required: param.required,
      description: param.description,
    };

    // OpenAPI v2: 'body' parameters use 'schema', others use 'type'
    if (param.in === "body") {
      if (param.schema) {
        normalized.schema = param.schema;
      }
    } else {
      normalized.type = param.type || "string";
      if (param.example !== undefined) {
        delete param.example; // Remove 'example' as it’s not allowed in v2
      }
    }

    // Ensure 'in' is valid
    if (
      !["query", "header", "path", "formData", "body"].includes(normalized.in)
    ) {
      console.warn(
        `Invalid 'in' value '${normalized.in}' for parameter '${normalized.name}', defaulting to 'query'`
      );
      normalized.in = "query";
    }

    return normalized;
  });
}

async function splitSpec(): Promise<void> {
  const CODEGEN_DIR = path.dirname(fileURLToPath(import.meta.url));
  const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs");
  const OUTPUT_DIR = path.join(SPECS_DIR, "split");

  // Find the latest spec file
  const specFiles = glob.sync(path.join(SPECS_DIR, "QuickBase_RESTful_*.json"));
  if (specFiles.length === 0) {
    console.error("No QuickBase_RESTful_*.json files found in specs/ folder.");
    process.exit(1);
  }
  const inputFile = specFiles.sort().pop() as string;
  const specContent = await fs.readFile(inputFile, "utf8");
  const spec: Spec = JSON.parse(specContent);

  // Define categories based on endpoint paths
  const categories: Record<string, string[]> = {
    apps: Object.keys(spec.paths).filter((p) => p.startsWith("/apps")),
    auth: Object.keys(spec.paths).filter((p) => p.startsWith("/auth")),
    fields: Object.keys(spec.paths).filter((p) => p.startsWith("/fields")),
    records: Object.keys(spec.paths).filter((p) => p.startsWith("/records")),
    tables: Object.keys(spec.paths).filter((p) => p.startsWith("/tables")),
    reports: Object.keys(spec.paths).filter((p) => p.startsWith("/reports")),
    relationships: Object.keys(spec.paths).filter((p) =>
      p.startsWith("/relationships")
    ),
    events: Object.keys(spec.paths).filter((p) => p.startsWith("/events")),
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Split spec by category
  for (const [category, paths] of Object.entries(categories)) {
    if (paths.length === 0) continue;

    const categorySpec: Spec = {
      swagger: "2.0", // OpenAPI v2
      info: spec.info || { title: `${category} API`, version: "1.0.0" },
      paths: {},
      definitions: {},
    };

    // Add relevant paths and normalize parameters
    for (const p of paths) {
      const pathObj = { ...spec.paths[p] };
      for (const method in pathObj) {
        if (pathObj[method].parameters) {
          pathObj[method].parameters = normalizeParameters(
            pathObj[method].parameters
          );
        }
      }
      categorySpec.paths[p] = pathObj;
    }

    // Add relevant definitions
    const refs = new Set<string>();
    const refRegex = /#\/definitions\/([^"]+)/g;
    const categorySpecString = JSON.stringify(categorySpec);
    let match;
    while ((match = refRegex.exec(categorySpecString))) {
      refs.add(match[1]);
    }
    if (spec.definitions) {
      for (const ref of refs) {
        if (spec.definitions[ref]) {
          categorySpec.definitions![ref] = spec.definitions[ref];
        }
      }
    }

    const outputFile = path.join(OUTPUT_DIR, `${category}.json`);
    await fs.writeFile(
      outputFile,
      JSON.stringify(categorySpec, null, 2),
      "utf8"
    );
    console.log(`Wrote ${outputFile}`);
  }
}

splitSpec().catch((error) => {
  console.error("Failed to split spec:", error);
  process.exit(1);
});
