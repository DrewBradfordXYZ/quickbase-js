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
      dir: "dist",
      format: "esm",
      sourcemap: true,
      compact: isProd,
      entryFileNames: "quickbase.js",
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
      "node-fetch",
    ],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, // No .d.ts here, handled by dts plugin
      }),
      isProd && terser(),
    ],
  },
  {
    input: "src/quickbaseClient.ts",
    output: {
      file: "dist/quickbase.d.ts",
      format: "esm",
      // Optional: sourcemap for .d.ts if needed for debugging
      // sourcemap: true,
    },
    plugins: [
      dts({
        tsconfig: "./tsconfig.json",
        // Ensure all referenced files are included
        respectExternal: true,
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
      return;
    }
    warn(warning);
  },
}));
