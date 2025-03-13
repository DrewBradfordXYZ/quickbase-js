import { execSync } from "child_process";
import { rollup } from "rollup";
import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import { rimrafSync } from "rimraf";
import {
  copyFileSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  statSync,
} from "fs";
import { join } from "path";

export const external = [
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
export const globals = { "node-fetch": "fetch" };

export const srcDir = join(process.cwd(), "src");
export const tempSrcDir = join(process.cwd(), "dist/temp-src");
export const excludeDirs = ["specs"];
export const excludeFiles = [];

export function copyAndRewriteTsExtensions(src, dest) {
  console.log(`Copying from ${src} to ${dest}`);
  mkdirSync(dest, { recursive: true });
  const files = readdirSync(src, { withFileTypes: true });

  for (const file of files) {
    const srcPath = join(src, file.name);
    const destPath = join(dest, file.name);

    if (file.isDirectory()) {
      if (excludeDirs.includes(file.name)) {
        console.log(`Skipping excluded directory ${srcPath}`);
        continue;
      }
      copyAndRewriteTsExtensions(srcPath, destPath);
    } else if (file.name.endsWith(".ts")) {
      if (excludeFiles.includes(file.name)) {
        console.log(`Skipping excluded file ${srcPath}`);
        continue;
      }
      console.log(`Processing ${srcPath} -> ${destPath}`);
      let fileContent = readFileSync(srcPath, "utf8");

      // Remove .ts extensions from import/export statements for runtime compatibility
      fileContent = removeTsExtensionsFromImports(fileContent);
      fileContent = removeTsExtensionsFromStarExports(fileContent);

      writeFileSync(destPath, fileContent, "utf8");
    } else {
      console.log(`Skipping non-.ts file ${srcPath}`);
    }
  }
}

export function removeTsExtensionsFromImports(content) {
  // Matches: 'from "./some/path.ts"' or 'from "../another.ts"'
  const importPattern = /from\s+(['"])(\.[\w\/-]+)\.ts\1/g;
  return content.replace(importPattern, `from $1$2$1`);
}

export function removeTsExtensionsFromStarExports(content) {
  // Matches: 'export * from "./some/path.ts"' or 'export * from "../another.ts"'
  const exportStarPattern = /export\s+\*\s+from\s+(['"])(\.[\w\/-]+)\.ts\1/g;
  return content.replace(exportStarPattern, `export * from $1$2$1`);
}

export async function createBundle(input, plugins, format, outputOptions) {
  const bundle = await rollup({
    input,
    external,
    plugins,
  });
  await bundle.write(outputOptions);
  await bundle.close();
}

export function compileTypeScript() {
  console.log("Running tsc...");
  const tsFiles = readdirSync(tempSrcDir, { recursive: true })
    .filter((file) => file.endsWith(".ts"))
    .map((file) => join(tempSrcDir, file));
  const tscCommand = `npx tsc ${tsFiles.join(" ")} --outDir ${join(
    process.cwd(),
    "dist/temp"
  )} --module ESNext --target ESNext --sourceMap --moduleResolution bundler --baseUrl ${process.cwd()}`;
  console.log(`Command: ${tscCommand}`);
  execSync(tscCommand, { stdio: "inherit" });
}

export async function generateDeclarations() {
  console.log("Generating declarations...");
  const dtsBundle = await rollup({
    input: "src/quickbaseClient.ts",
    plugins: [dts({ tsconfig: "./tsconfig.json", respectExternal: true })],
  });
  await dtsBundle.write({ file: "dist/esm/quickbase.d.ts", format: "esm" });
  await dtsBundle.write({ file: "dist/umd/quickbase.umd.d.ts", format: "umd" });
  await dtsBundle.close();
}

export function listFilesWithSizes(dir, prefix = "") {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = join(dir, file.name);
    if (file.isDirectory()) {
      listFilesWithSizes(filePath, `${prefix}${file.name}/`);
    } else {
      const stats = statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`${prefix}${file.name} - ${sizeKB} KB`);
    }
  }
}
