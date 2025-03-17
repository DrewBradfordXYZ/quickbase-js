#!/usr/bin/env node

import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import fastJsonPatch from "fast-json-patch"; // Default import
import { Spec } from "./types/spec";

const { compare } = fastJsonPatch; // Destructure from default

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

// Simple HTML formatter for JSON Patch
function formatPatchToHtml(patch: any[]): string {
  let html = `<html><head><title>Override Report Diff</title>${HTML_STYLE}</head><body><h1>Override Report Diff</h1>`;
  patch.forEach((op) => {
    if (op.op === "replace") {
      html += `<h2>Path: ${
        op.path
      }</h2><p>Modified: <span class="jsondiffpatch-deleted">${JSON.stringify(
        op.value
      )}</span> → <span class="jsondiffpatch-added">${JSON.stringify(
        op.value
      )}</span></p>`;
    } else if (op.op === "add") {
      html += `<h2>Path: ${
        op.path
      }</h2><p>Added: <span class="jsondiffpatch-added">${JSON.stringify(
        op.value
      )}</span></p>`;
    } else if (op.op === "remove") {
      html += `<h2>Path: ${
        op.path
      }</h2><p>Removed: <span class="jsondiffpatch-deleted">${JSON.stringify(
        op.value
      )}</span></p>`;
    }
  });
  html += "</body></html>";
  return html;
}

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

    console.log("Generating patch...");
    const patch = compare(rawSpec, fixedSpec);

    console.log("Writing JSON override report...");
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(
      JSON_OUTPUT_FILE,
      JSON.stringify(patch, null, 2),
      "utf8"
    );

    console.log("Writing HTML override report...");
    const htmlContent = formatPatchToHtml(patch);
    await fs.writeFile(HTML_OUTPUT_FILE, htmlContent, "utf8");

    console.log("Override report generated successfully!");
  } catch (error) {
    console.error("Failed to generate override report:", error);
    process.exit(1);
  }
}

async function main() {
  await generateOverrideReport();
}

main();
