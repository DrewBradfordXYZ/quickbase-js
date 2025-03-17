#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jsondiffpatch from "jsondiffpatch"; // Default import
import { Spec } from "./types/spec.ts";

const { diff, formatters } = jsondiffpatch; // Destructure from default

// Basic CSS for readability
const HTML_STYLE = `
  <style>
    .jsondiffpatch-delta { font-family: monospace; }
    .jsondiffpatch-added { background-color: #e6ffe6; color: #006400; }
    .jsondiffpatch-deleted { background-color: #ffe6e6; color: #8b0000; text-decoration: line-through; }
    .jsondiffpatch-modified { background-color: #fff3e6; }
    .jsondiffpatch-unchanged { color: #666; }
    .jsondiffpatch-key { font-weight: bold; }
  </style>
`;

// Rest of the script remains unchanged...
async function generateOverrideReport(): Promise<void> {
  try {
    const CODEGEN_DIR = path.dirname(fileURLToPath(import.meta.url));
    const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs");
    const OUTPUT_DIR = path.join(CODEGEN_DIR, "output");
    const RAW_SPEC = path.join(
      SPECS_DIR,
      "QuickBase_RESTful_API_2025-03-04T06_22_39.725Z.json"
    );
    const FIXED_SPEC = path.join(OUTPUT_DIR, "quickbase-fixed.json");
    const JSON_OUTPUT_FILE = path.join(OUTPUT_DIR, "override-report.json");
    const HTML_OUTPUT_FILE = path.join(OUTPUT_DIR, "override-report.html");

    console.log("Cleaning up old override report...");
    if (
      await fs
        .stat(JSON_OUTPUT_FILE)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.unlink(JSON_OUTPUT_FILE);
      console.log(`Removed ${JSON_OUTPUT_FILE}`);
    }
    if (
      await fs
        .stat(HTML_OUTPUT_FILE)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.unlink(HTML_OUTPUT_FILE);
      console.log(`Removed ${HTML_OUTPUT_FILE}`);
    } else {
      console.log("No old override reports found to remove.");
    }

    if (
      !(await fs
        .stat(RAW_SPEC)
        .then(() => true)
        .catch(() => false))
    ) {
      console.error(`Raw spec ${RAW_SPEC} not found.`);
      process.exit(1);
    }
    if (
      !(await fs
        .stat(FIXED_SPEC)
        .then(() => true)
        .catch(() => false))
    ) {
      console.error(
        `Fixed spec ${FIXED_SPEC} not found. Run 'npm run fix-spec' first.`
      );
      process.exit(1);
    }

    console.log(`Reading raw spec from ${RAW_SPEC}...`);
    const rawContent = await fs.readFile(RAW_SPEC, "utf8");
    const rawSpec: Spec = JSON.parse(rawContent);

    console.log(`Reading fixed spec from ${FIXED_SPEC}...`);
    const fixedContent = await fs.readFile(FIXED_SPEC, "utf8");
    const fixedSpec: Spec = JSON.parse(fixedContent);

    const overrides = {
      overriddenPaths: [] as string[],
      overriddenDefinitions: [] as string[],
      conflicts: [] as string[],
      diff: {
        paths: {} as Record<string, Record<string, any>>,
        definitions: {} as Record<string, any>,
      },
    };
    let htmlContent = `<html><head><title>Override Report Diff</title>${HTML_STYLE}</head><body><h1>Override Report Diff</h1>`;

    console.log("Analyzing overridden paths and diffs...");
    for (const pathKey in fixedSpec.paths) {
      const fixedPath = fixedSpec.paths[pathKey];
      const rawPath = rawSpec.paths[pathKey] || {};

      for (const method in fixedPath) {
        const fixedOp = fixedPath[method];
        const rawOp = rawPath[method] || {};

        const fixedBodyParam = fixedOp.parameters?.find(
          (p) => "in" in p && p.in === "body"
        );
        const rawBodyParam = rawOp.parameters?.find(
          (p) => "in" in p && p.in === "body"
        );

        if (
          fixedBodyParam?.schema?.$ref &&
          (!rawBodyParam ||
            fixedBodyParam.schema.$ref !== rawBodyParam?.schema?.$ref)
        ) {
          if (!overrides.overriddenPaths.includes(pathKey)) {
            overrides.overriddenPaths.push(pathKey);
          }
          if (!overrides.diff.paths[pathKey]) {
            overrides.diff.paths[pathKey] = {};
          }
          const bodyDiff = diff(
            rawBodyParam ? rawBodyParam.schema || {} : {},
            fixedBodyParam.schema
          );
          if (bodyDiff) {
            overrides.diff.paths[pathKey][method] = bodyDiff;
            htmlContent += `<h2>Path: ${pathKey} (${method})</h2>`;
            htmlContent += formatters.html.format(
              bodyDiff,
              rawBodyParam?.schema || {}
            );
          }
        }
      }
    }

    console.log("Analyzing overridden definitions and diffs...");
    for (const defKey in fixedSpec.definitions) {
      const rawDef = rawSpec.definitions?.[defKey] || null;
      const fixedDef = fixedSpec.definitions[defKey];
      const defDiff = diff(rawDef, fixedDef);
      if (defDiff) {
        overrides.overriddenDefinitions.push(defKey);
        overrides.diff.definitions[defKey] = defDiff;
        htmlContent += `<h2>Definition: ${defKey}</h2>`;
        htmlContent += formatters.html.format(defDiff, rawDef);
      }
    }

    console.log("Checking for conflicts...");
    for (const pathKey in rawSpec.paths) {
      if (!fixedSpec.paths[pathKey]) {
        overrides.conflicts.push(`Path ${pathKey} removed in fixed spec`);
        htmlContent += `<h2>Conflict: Path ${pathKey}</h2><p>Removed in fixed spec</p>`;
      }
    }
    for (const defKey in rawSpec.definitions) {
      if (!fixedSpec.definitions[defKey]) {
        overrides.conflicts.push(`Definition ${defKey} removed in fixed spec`);
        htmlContent += `<h2>Conflict: Definition ${defKey}</h2><p>Removed in fixed spec</p>`;
      }
    }

    htmlContent += "</body></html>";

    console.log(`Writing JSON override report to ${JSON_OUTPUT_FILE}...`);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(
      JSON_OUTPUT_FILE,
      JSON.stringify(overrides, null, 2),
      "utf8"
    );

    console.log(`Writing HTML override report to ${HTML_OUTPUT_FILE}...`);
    await fs.writeFile(HTML_OUTPUT_FILE, htmlContent, "utf8");

    console.log("Override report with enhanced diffs generated successfully!");
  } catch (error) {
    console.error("Failed to generate override report:", error);
    process.exit(1);
  }
}

async function main() {
  await generateOverrideReport();
}

main();
