// build-umd.js
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
  listFilesWithSizes,
} from "./build-common.js";

// Clean specific folders for UMD build
rimrafSync("dist/umd");
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

// UMD Builds
console.log("Building UMD bundles...");

// Generate unminified UMD bundle
console.log("Building unminified UMD bundle...");
await createBundle(
  "dist/temp/client/quickbaseClient.js", // Updated entry point
  [nodeResolve({ preferBuiltins: false, browser: true }), commonjs()],
  "umd",
  {
    file: join(process.cwd(), "dist/umd", "quickbase.umd.js"),
    format: "umd",
    name: "QuickBase", // Consistent with current version
    sourcemap: true,
    globals,
  }
);

// Generate minified UMD bundle
console.log("Building minified UMD bundle...");
await createBundle(
  "dist/temp/client/quickbaseClient.js",
  [
    nodeResolve({ preferBuiltins: false, browser: true }),
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
  "umd",
  {
    file: join(process.cwd(), "dist/umd", "quickbase.umd.min.js"),
    format: "umd",
    name: "QuickBase",
    sourcemap: true,
    globals,
  }
);

// Clean up
rimrafSync("dist/temp");
rimrafSync("dist/temp-src");

// List generated files
console.log("\nGenerated files:");
listFilesWithSizes(join(process.cwd(), "dist/umd"));

console.log("\nUMD build completed successfully");
