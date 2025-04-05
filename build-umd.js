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
  listFilesWithSizes,
} from "./build-common.js";

// Clean specific folders for UMD build
rimrafSync("dist/umd");
rimrafSync("dist/temp");
rimrafSync("dist/temp-src");

// Copy and rewrite TS files
copyAndRewriteTsExtensions(srcDir, tempSrcDir);

// Compile TypeScript
compileTypeScript();

// UMD Builds
console.log("Building UMD bundles...");

// Generate unminified UMD bundle
console.log("Building unminified UMD bundle...");
await createBundle(
  "dist/temp/quickbaseClient.js",
  [nodeResolve({ preferBuiltins: true, browser: true }), commonjs()],
  "umd",
  {
    file: join(process.cwd(), "dist/umd", "quickbase.umd.js"),
    format: "umd",
    name: "QuickbaseJS",
    sourcemap: true,
    globals,
  }
);

// Generate minified UMD bundle
console.log("Building minified UMD bundle...");
await createBundle(
  "dist/temp/quickbaseClient.js",
  [
    nodeResolve({ preferBuiltins: true, browser: true }),
    commonjs(),
    terser({
      keep_fnames: true, // Preserve function names for generated API methods
      mangle: {
        properties: {
          regex: /^(withPaginationDisabled|withPaginationLimit)$/, // Preserve only these property names
        },
      },
    }),
  ],
  "umd",
  {
    file: join(process.cwd(), "dist/umd", "quickbase.umd.min.js"),
    format: "umd",
    name: "QuickbaseJS",
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
