#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = join(__dirname, "..", "src", "generated");
const MODELS_DIR = join(GENERATED_DIR, "models");
const SPEC_FILE = join(__dirname, "output", "quickbase-fixed.json");

function toPascalCase(str: string): string {
  return str.replace(/(^\w|_\w)/g, (match) =>
    match.replace("_", "").toUpperCase()
  );
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function mapOpenApiTypeToTs(openApiType: string): string {
  switch (openApiType) {
    case "integer":
    case "number":
      return "number";
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    case "object":
      return "object";
    default:
      return "any";
  }
}

function generateItemsInnerInterface(
  itemSchema: any,
  itemName: string
): string {
  const properties = itemSchema?.properties || {};
  const propsStr = Object.entries(properties)
    .map(([key, prop]: [string, any]) => {
      let type;
      if (key === "permissions" && prop.type === "array") {
        type = "Permission[]";
      } else if (key === "properties" && prop.type === "object") {
        type = "{ [key: string]: any }";
      } else {
        type = mapOpenApiTypeToTs(prop.type);
      }
      const isRequired = itemSchema.required?.includes(key);
      const description = prop.description ? ` * ${prop.description}` : "";
      return `  /**
${description}
 * @type {${type}}
 */
  ${key}${isRequired ? "" : "?"}: ${type};`;
    })
    .join("\n");

  const additionalProps =
    itemSchema.additionalProperties === true
      ? `  /**
   * Allows additional unspecified properties
   * @type {any}
   */
  [key: string]: any;`
      : "";

  return `
/* Auto-generated by post-process-generated.ts */
import { mapValues } from '../runtime';
import { Permission } from './Permission';

/**
 * Auto-generated model for ${itemName}
 */
export interface ${itemName} {
${propsStr}
${additionalProps}
}

export function ${itemName}FromJSON(json: any): ${itemName} {
  return json || {};
}

export function ${itemName}ToJSON(value?: ${itemName} | null): any {
  return value || {};
}
  `.trim();
}

function postProcessGeneratedFiles() {
  console.log("Starting post-processing...");
  console.log("Spec file path:", SPEC_FILE);

  try {
    if (!existsSync(SPEC_FILE)) {
      console.error(
        `Spec file ${SPEC_FILE} not found. Run 'npm run fix-spec' first.`
      );
      process.exit(1);
    }

    const spec = JSON.parse(readFileSync(SPEC_FILE, "utf8"));
    console.log("Spec loaded successfully.");

    const responseMap: Record<string, string> = {};
    for (const pathKey in spec.paths) {
      const pathObj = spec.paths[pathKey];
      if (!pathObj || typeof pathObj !== "object") continue;
      for (const method in pathObj) {
        const operation = pathObj[method];
        const opId =
          operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
        const response = operation.responses?.["200"];
        if (response && response.schema?.$ref) {
          const refName = response.schema.$ref.split("/").pop() || "";
          responseMap[opId] = refName;
          console.log(`Mapped ${opId} to ${refName}`);
        }
      }
    }

    for (const [opId, refName] of Object.entries(responseMap)) {
      try {
        const def = spec.definitions[refName];
        if (!def) {
          console.log(`Definition for ${refName} not found; skipping`);
          continue;
        }

        const responseFile = join(MODELS_DIR, `${toPascalCase(refName)}.ts`);

        if (def.type === "array") {
          const itemRef = def.items?.$ref
            ? def.items.$ref.split("/").pop()
            : `${toPascalCase(refName)}ItemsInner`;
          const itemsFile = join(MODELS_DIR, `${itemRef}.ts`);

          if (!existsSync(itemsFile)) {
            console.log(`Creating missing ${itemRef}.ts`);
            const content = def.items?.$ref
              ? `
/* Auto-generated by post-process-generated.ts */
import { mapValues } from '../runtime';

/**
 * Auto-generated model for ${itemRef}
 */
export interface ${itemRef} {
  [key: string]: any; // Placeholder; refine as needed
}

export function ${itemRef}FromJSON(json: any): ${itemRef} {
  return json || {};
}

export function ${itemRef}ToJSON(value?: ${itemRef} | null): any {
  return value || {};
}
            `
              : generateItemsInnerInterface(def.items || {}, itemRef);
            ensureDir(MODELS_DIR);
            writeFileSync(itemsFile, content.trim(), "utf8");
          }

          if (existsSync(responseFile)) {
            console.log(`Rewriting ${refName}.ts as array`);
            const content = `
/* Auto-generated by post-process-generated.ts */
import { ${itemRef}, ${itemRef}FromJSON, ${itemRef}ToJSON } from './${itemRef}';

/**
 * Response for ${opId}
 */
export type ${toPascalCase(refName)} = ${itemRef}[];

/**
 * Convert JSON to ${toPascalCase(refName)}
 */
export function ${toPascalCase(refName)}FromJSON(json: any): ${toPascalCase(
              refName
            )} {
  if (!json) return [];
  return json.map(${itemRef}FromJSON);
}

/**
 * Convert ${toPascalCase(refName)} to JSON
 */
export function ${toPascalCase(refName)}ToJSON(value?: ${toPascalCase(
              refName
            )} | null): any {
  if (!value) return [];
  return value.map(${itemRef}ToJSON);
}
            `;
            writeFileSync(responseFile, content.trim(), "utf8");
          }
        } else if (def.type === "object") {
          console.log(`Processing ${refName}.ts as object`);
          const content = generateItemsInnerInterface(
            def,
            toPascalCase(refName)
          );
          ensureDir(MODELS_DIR);
          writeFileSync(responseFile, content.trim(), "utf8");
        }
      } catch (error) {
        console.error(`Error processing ${refName}:`, error);
      }
    }

    console.log("Post-processing complete.");
  } catch (error) {
    console.error("Error in post-processing:", error);
    process.exit(1);
  }
}

postProcessGeneratedFiles();
