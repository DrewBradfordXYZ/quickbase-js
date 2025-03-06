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
      file: "dist/quickbaseClient.js",
      format: "esm",
      sourcemap: true,
      compact: isProd,
    },
    plugins: [
      nodeResolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      typescript({
        tsconfig: "./tsconfig.build.json",
        declaration: false, // Explicitly disable here too
      }),
      isProd && terser(),
    ],
  },
  {
    input: "src/quickbaseClient.ts",
    output: {
      file: "dist/quickbaseClient.d.ts",
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
