import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";

const isProd = process.env.NODE_ENV === "production";

export default [
  // Single ESM Build
  {
    input: "src/quickbaseClient.ts",
    output: {
      file: "dist/quickbaseClient.js", // Simple name for broad use
      format: "esm",
      sourcemap: true,
      compact: isProd,
    },
    plugins: [
      nodeResolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.build.json" }),
      isProd && terser(),
    ],
  },
  // Type Definitions
  {
    input: "src/quickbaseClient.ts",
    output: {
      file: "dist/quickbaseClient.d.ts",
      format: "esm",
    },
    plugins: [dts()],
  },
];
