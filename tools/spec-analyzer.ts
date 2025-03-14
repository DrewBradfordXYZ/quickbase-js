import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as glob from "glob";

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: { type?: string; items?: any; $ref?: string; properties?: any };
  example?: any;
}

interface Operation {
  parameters?: Parameter[];
  responses?: Record<string, { description: string; schema?: any }>;
  operationId?: string;
  summary?: string;
  tags?: string[];
}

interface Spec {
  paths: Record<string, Record<string, Operation>>;
  definitions?: Record<string, any>;
}

interface TypeInference {
  fieldId: string;
  inferredType: string;
  source: "schema" | "example";
  confidence: number;
  context: string;
}

interface AnalysisReport {
  requestTypes: TypeInference[];
  responseTypes: { [status: string]: TypeInference[] };
  dynamicFields: TypeInference[];
  errors: string[];
}

function inferTypeFromValue(value: any): string {
  if (typeof value === "string") return "string";
  if (typeof value === "number")
    return Number.isInteger(value) ? "integer" : "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) {
    if (value.length === 0) return "any[]";
    const itemTypes = value.map(inferTypeFromValue);
    const uniqueTypes = [...new Set(itemTypes)];
    return uniqueTypes.length === 1 ? `${uniqueTypes[0]}[]` : "any[]";
  }
  if (typeof value === "object" && value !== null) {
    return "object";
  }
  return "any";
}

function analyzeDynamicFields(
  schema: any,
  analysis: AnalysisReport,
  context: string
) {
  const examples = schema["x-amf-examples"];
  if (examples) {
    for (const [exampleName, example] of Object.entries(examples)) {
      const data = example.value?.data;
      if (Array.isArray(data)) {
        data.forEach((record: any, index: number) => {
          for (const [fieldId, fieldValue] of Object.entries(record)) {
            const inferredType = inferTypeFromValue(fieldValue.value);
            analysis.dynamicFields.push({
              fieldId,
              inferredType,
              source: "example",
              confidence: 0.8,
              context: `${context}-example-${exampleName}-${index}`,
            });
          }
        });
      }
    }
  }

  // Add schema-based type extraction logic
  if (schema.properties?.data?.items) {
    // Add logic to extract types from schema
  }
}

function analyzeUpsertSpec(spec: Spec): AnalysisReport {
  const upsertPath = spec.paths["/records"]?.post;
  if (!upsertPath)
    return {
      errors: ["Upsert endpoint not found"],
      requestTypes: [],
      responseTypes: {},
      dynamicFields: [],
    };

  const analysis: AnalysisReport = {
    requestTypes: [],
    responseTypes: { "200": [], "207": [] },
    dynamicFields: [],
    errors: [],
  };

  const requestSchema = upsertPath.parameters?.find(
    (p) => p.in === "body"
  )?.schema;
  if (requestSchema) {
    analyzeDynamicFields(requestSchema, analysis, "request");
  }

  for (const status of ["200", "207"]) {
    const responseSchema = upsertPath.responses?.[status]?.schema;
    if (responseSchema) {
      analyzeDynamicFields(responseSchema, analysis, `response-${status}`);
    }
  }

  return analysis;
}

async function runAnalysis() {
  try {
    const CODEGEN_DIR = path.dirname(fileURLToPath(import.meta.url));
    const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs");
    const OUTPUT_DIR = path.join(CODEGEN_DIR, "..", "tools", "analysis");
    console.log("Finding latest QuickBase RESTful API spec...");
    const specFiles = glob.sync(
      path.join(SPECS_DIR, "QuickBase_RESTful_*.json")
    );
    if (specFiles.length === 0) {
      console.error(
        "No QuickBase_RESTful_*.json files found in specs/ folder."
      );
      process.exit(1);
    }
    const inputFile = specFiles.sort().pop() as string;
    console.log(`Reading ${path.basename(inputFile)} from specs/...`);
    const specContent = await fs.readFile(inputFile, "utf8");
    const spec: Spec = JSON.parse(specContent);

    const analysis = analyzeUpsertSpec(spec);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(
      path.join(OUTPUT_DIR, "upsert-analysis.json"),
      JSON.stringify(analysis, null, 2),
      "utf8"
    );
    console.log(
      "Analysis complete. Output written to:",
      path.join(OUTPUT_DIR, "upsert-analysis.json")
    );
  } catch (error) {
    console.error("Failed to analyze spec:", error);
    process.exit(1);
  }
}

runAnalysis();
