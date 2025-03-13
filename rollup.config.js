import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

const isProd = process.env.NODE_ENV === "production";

// External dependencies for both ESM and UMD builds
const external = [
  "node:http",
  "node:https",
  "node:zlib",
  "node:stream",
  "node:buffer",
  "node:util",
  "node:url",
  "node:net",
  "node:fs",
  "node:path",
  "node-fetch",
];

// Global mappings for UMD (browser) build
const globals = {
  "node-fetch": "fetch", // Map node-fetch to window.fetch in browsers
};

export default [
  // ESM Build
  {
    input: "src/quickbaseClient.ts",
    output: {
      dir: "dist/esm",
      format: "esm",
      sourcemap: true,
      entryFileNames: "quickbase.js",
    },
    external,
    plugins: [
      nodeResolve({ preferBuiltins: true }), // Node.js resolution
      commonjs(), // Convert CommonJS to ESM
      typescript({
        tsconfig: "./tsconfig.json",
        noEmitOnError: true, // Fail on TypeScript errors
        // Use Rollup to emit JavaScript, overriding noEmit for this build
      }),
      isProd && terser(), // Minification for production
    ],
  },
  // UMD Build
  {
    input: "src/quickbaseClient.ts",
    output: {
      file: "dist/umd/quickbase.umd.js",
      format: "umd",
      name: "QuickbaseJS", // Global name for browser
      sourcemap: true,
      globals,
    },
    external,
    plugins: [
      nodeResolve({ preferBuiltins: true, browser: true }), // Browser-first resolution
      commonjs(), // Convert CommonJS to UMD
      typescript({
        tsconfig: "./tsconfig.json",
        noEmitOnError: true, // Fail on TypeScript errors
        // Use Rollup to emit JavaScript, overriding noEmit for this build
      }),
      isProd && terser(), // Minification for production
    ],
  },
  // ESM Declarations
  {
    input: "src/quickbaseClient.ts",
    output: {
      file: "dist/esm/quickbase.d.ts",
      format: "esm",
    },
    plugins: [
      dts({
        tsconfig: "./tsconfig.json",
        respectExternal: true, // Include external dependencies in declarations
      }),
    ],
  },
  // UMD Declarations
  {
    input: "src/quickbaseClient.ts",
    output: {
      file: "dist/umd/quickbase.umd.d.ts",
      format: "umd",
    },
    plugins: [
      dts({
        tsconfig: "./tsconfig.json",
        respectExternal: true, // Include external dependencies in declarations
      }),
    ],
  },
].map((config) => ({
  ...config,
  onwarn(warning, warn) {
    // Suppress TypeScript plugin warnings
    if (
      warning.code === "PLUGIN_WARNING" &&
      warning.plugin === "typescript" &&
      warning.message.includes("TS5096")
    ) {
      return;
    }
    warn(warning);
  },
}));
