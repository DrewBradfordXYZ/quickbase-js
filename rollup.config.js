import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";

const isProd = process.env.NODE_ENV === "production";

export default [
  {
    input: "src/quickbaseClient.ts",
    output: {
      dir: "dist", // Switch to dir for multiple chunks
      format: "esm",
      sourcemap: true,
      compact: isProd,
      entryFileNames: "quickbaseClient.js", // Maintain output file name
    },
    external: [
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
      "node-fetch", // Externalize node-fetch
    ],
    plugins: [
      nodeResolve({ preferBuiltins: true }), // Use Node.js built-ins
      commonjs(), // Handle CommonJS modules like node-fetch
      typescript({
        tsconfig: "./tsconfig.build.json",
        declaration: false, // Keep this
      }),
      isProd && terser(),
    ],
  },
  {
    input: "src/quickbaseClient.ts",
    output: {
      file: "dist/quickbaseClient.d.ts", // Keep as file since dts generates a single file
      format: "esm",
    },
    plugins: [
      dts({
        tsconfig: "./tsconfig.build.json",
      }),
    ],
  },
].map((config) => ({
  ...config,
  onwarn(warning, warn) {
    if (
      warning.code === "PLUGIN_WARNING" &&
      warning.plugin === "typescript" &&
      warning.message.includes("TS5096")
    ) {
      return; // Suppress TS5096
    }
    warn(warning);
  },
}));
