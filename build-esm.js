// build-esm.js
import { rimrafSync } from "rimraf";
import { join } from "path";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import { readdirSync, existsSync } from "fs";

import {
  copyAndRewriteTsExtensions,
  compileTypeScript,
  createBundle,
  external,
  globals,
  srcDir,
  tempSrcDir,
  generateDeclarations,
  listFilesWithSizes,
} from "./build-common.js";

// Clean specific folders for ESM build
rimrafSync("dist/esm");
rimrafSync("dist/temp");
rimrafSync("dist/temp-src");

// Copy and rewrite TS files
copyAndRewriteTsExtensions(srcDir, tempSrcDir);

// Wait to ensure file writes are complete
await new Promise((resolve) => setTimeout(resolve, 1000));

// Verify that dist/temp-src/ contains files
const tempSrcFiles = readdirSync(tempSrcDir, { recursive: true });
if (tempSrcFiles.length === 0) {
  console.error("Error: No files found in dist/temp-src/. Aborting build.");
  process.exit(1);
}
console.log(`Found ${tempSrcFiles.length} files in dist/temp-src/`);

// Verify critical file exists
const criticalFile = join(tempSrcDir, "client", "quickbaseClient.ts");
if (!existsSync(criticalFile)) {
  console.error(
    `Error: Critical file ${criticalFile} not found. Aborting build.`
  );
  process.exit(1);
}

// Compile TypeScript
compileTypeScript();

// ESM Builds
console.log("Building ESM bundles...");

// Generate unminified ESM bundle
console.log("Building unminified ESM bundle...");
await createBundle(
  "dist/temp/client/quickbaseClient.js", // Updated entry point
  [nodeResolve({ preferBuiltins: true }), commonjs()],
  "esm",
  {
    dir: "dist/esm",
    format: "esm",
    sourcemap: true,
    entryFileNames: "quickbase.js",
  }
);

// Generate minified ESM bundle
console.log("Building minified ESM bundle...");
await createBundle(
  "dist/temp/client/quickbaseClient.js",
  [
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    terser({
      keep_fnames: true,
      mangle: {
        properties: {
          regex: /^(withPaginationDisabled|withPaginationLimit)$/,
        },
      },
    }),
  ],
  "esm",
  {
    dir: "dist/esm",
    format: "esm",
    sourcemap: true,
    entryFileNames: "quickbase.min.js",
  }
);

// Generate declarations
await generateDeclarations();

// Clean up
rimrafSync("dist/temp");
rimrafSync("dist/temp-src");

// List generated files
console.log("\nGenerated files:");
listFilesWithSizes(join(process.cwd(), "dist/esm"));

console.log("\nESM build completed successfully");
