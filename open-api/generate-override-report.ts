#!/usr/bin/env node

import { promises as fs } from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import fastJsonPatch, { AddOperation } from "fast-json-patch";
import { Spec } from "./types/spec";

const { compare, applyPatch } = fastJsonPatch;

// Basic CSS for readability
const HTML_STYLE = `
  <style>
    .jsondiffpatch-delta { font-family: monospace; }
    .jsondiffpatch-added { background-color: #e6ffe6; color: #006400; }
    .jsondiffpatch-deleted { background-color: #ffe6e6; color: #8b0000; text-decoration: line-through; }
    .jsondiffpatch-modified { background-color: #fff3e6; }
    .jsondiffpatch-unchanged { color: #666; }
    .jsondiffpatch-key { font-weight: bold; }
    .jsondiffpatch-tags { color: purple; font-style: italic; }
  </style>
`;

// Helper to decode JSON Pointer paths
function decodeJsonPointer(jsonPointerSegment: string): string {
  // Split the full path and decode each segment
  const segments = jsonPointerSegment.split("/").filter(Boolean);
  const decodedSegments = segments.map((seg) =>
    seg.replace("~1", "/").replace("~0", "~")
  );
  // Remove "paths" prefix and join with a single leading slash
  const pathIndex = decodedSegments.indexOf("paths");
  const relevantSegments =
    pathIndex !== -1 && pathIndex + 1 < decodedSegments.length
      ? decodedSegments.slice(pathIndex + 1)
      : decodedSegments;
  return "/" + relevantSegments.join("/"); // Ensure single leading slash
}

// Enhanced HTML formatter with clean paths, tags, and old vs. new values
function formatPatchToHtml(patch: any[], spec: Spec): string {
  let html = `<html><head><title>Override Report Diff</title>${HTML_STYLE}</head><body><h1>Override Report Diff</h1>`;
  patch.forEach((op) => {
    const pathParts = op.path.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    let oldValue = "N/A";
    let context = decodeJsonPointer(op.path);
    let method = op.method ? op.method.toUpperCase() : "";

    if (method) context = context.replace(`/${method}`, "") + ` [${method}]`;

    if (op.op === "replace" || op.op === "remove") {
      const reversePatch: AddOperation<any>[] = [
        { op: "add", path: op.path, value: op.value },
      ];
      const tempSpec = JSON.parse(JSON.stringify(spec));
      applyPatch(tempSpec, reversePatch);
      const pathSegments = op.path.split("/").slice(1);
      oldValue =
        pathSegments.reduce((obj: any, key: string) => obj?.[key], tempSpec) ||
        "N/A";
      oldValue = JSON.stringify(oldValue);
    }

    const tagDisplay =
      op.tags && op.tags.length > 0 ? ` (Tags: ${op.tags.join(", ")})` : "";

    if (op.op === "replace") {
      html += `<h2>Path: ${context}${tagDisplay}</h2><p>Modified: <span class="jsondiffpatch-deleted">${oldValue}</span> → <span class="jsondiffpatch-added">${JSON.stringify(
        op.value
      )}</span></p>`;
    } else if (op.op === "add") {
      html += `<h2>Path: ${context}${tagDisplay}</h2><p>Added: <span class="jsondiffpatch-added">${JSON.stringify(
        op.value
      )}</span></p>`;
    } else if (op.op === "remove") {
      html += `<h2>Path: ${context}${tagDisplay}</h2><p>Removed: <span class="jsondiffpatch-deleted">${oldValue}</span></p>`;
    }
  });
  html += "</body></html>";
  return html;
}

async function generateOverrideReport(): Promise<void> {
  try {
    const CODEGEN_DIR: string = path.dirname(fileURLToPath(import.meta.url));
    const SPECS_DIR: string = path.join(CODEGEN_DIR, "..", "specs");
    const OUTPUT_DIR: string = path.join(CODEGEN_DIR, "output");
    const RAW_SPEC: string = path.join(
      SPECS_DIR,
      "QuickBase_RESTful_API_2025-03-04T06_22_39.725Z.json"
    );
    const FIXED_SPEC: string = path.join(OUTPUT_DIR, "quickbase-fixed.json");
    const JSON_OUTPUT_FILE: string = path.join(
      OUTPUT_DIR,
      "override-report.json"
    );
    const HTML_OUTPUT_FILE: string = path.join(
      OUTPUT_DIR,
      "override-report.html"
    );

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

    // Enhance patch with decoded paths and tags inferred from parent operation
    const enhancedPatch = patch.map((op) => {
      let decodedPath = decodeJsonPointer(op.path);
      let tags: string[] = [];
      let method: string = "";

      if (op.path.startsWith("/paths")) {
        const pathParts = op.path.split("/").filter(Boolean);
        if (
          pathParts.length >= 3 &&
          ["get", "post", "put", "delete"].includes(pathParts[2].toLowerCase())
        ) {
          const fullPathSegment = "/paths/" + pathParts[1];
          const basePath = decodeJsonPointer(fullPathSegment);
          method = pathParts[2];
          console.log(`Debug: basePath=${basePath}, method=${method}`); // Debug log
          if (rawSpec.paths[basePath]?.[method]?.tags) {
            tags = rawSpec.paths[basePath][method].tags || [];
          } else if (rawSpec.paths[basePath]?.[method]) {
            console.log(`No tags found for ${basePath} [${method}]`);
          } else {
            console.log(`Operation not found: ${basePath} [${method}]`);
          }
        }
      }

      return {
        ...op,
        decodedPath,
        tags: tags.length > 0 ? tags : undefined,
        method,
      };
    });

    console.log("Writing JSON override report...");
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(
      JSON_OUTPUT_FILE,
      JSON.stringify(enhancedPatch, null, 2),
      "utf8"
    );

    console.log("Writing HTML override report...");
    const htmlContent = formatPatchToHtml(enhancedPatch, rawSpec);
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
