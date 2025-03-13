import { rimrafSync } from "rimraf";
import { join } from "path";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
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

// Compile TypeScript
compileTypeScript();

// ESM Builds
console.log("Building ESM bundles...");

// Generate unminified ESM bundle
console.log("Building unminified ESM bundle...");
await createBundle(
  "dist/temp/quickbaseClient.js",
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
  "dist/temp/quickbaseClient.js",
  [nodeResolve({ preferBuiltins: true }), commonjs(), terser()],
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
