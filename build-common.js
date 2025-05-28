// build-common.js
import { execSync } from "child_process";
import { rollup } from "rollup";
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
  "xml2js", // Include xml2js
];
export const globals = { "node-fetch": "fetch", xml2js: "xml2js" };

export const srcDir = join(process.cwd(), "src");
export const tempSrcDir = join(process.cwd(), "dist/temp-src");
export const excludeDirs = ["specs"];
export const excludeFiles = ["generated/index.ts"];

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
      if (excludeFiles.some((excluded) => srcPath.includes(excluded))) {
        console.log(`Skipping excluded file ${srcPath}`);
        continue;
      }
      console.log(`Processing ${srcPath} -> ${destPath}`);
      let fileContent = readFileSync(srcPath, "utf8");
      fileContent = removeTsExtensionsFromImports(fileContent);
      fileContent = removeTsExtensionsFromStarExports(fileContent);
      writeFileSync(destPath, fileContent, "utf8");
    } else {
      console.log(`Copying non-.ts file ${srcPath} -> ${destPath}`);
      copyFileSync(srcPath, destPath);
    }
  }
}

export function removeTsExtensionsFromImports(content) {
  const importPattern = /from\s+(['"])(\.[\w\/-]+)\.ts\1/g;
  return content.replace(importPattern, `from $1$2$1`);
}

export function removeTsExtensionsFromStarExports(content) {
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
  const maxRetries = 5;
  let retries = 0;
  let success = false;

  while (retries < maxRetries && !success) {
    try {
      const files = readdirSync(tempSrcDir, { recursive: true });
      if (files.length === 0) {
        console.error(
          `No files found in ${tempSrcDir}, retrying (${
            retries + 1
          }/${maxRetries})...`
        );
        retries++;
        execSync("sleep 0.5");
        continue;
      }
      const tsFiles = files
        .filter((file) => file.endsWith(".ts"))
        .map((file) => join(tempSrcDir, file));
      console.log(`Found ${tsFiles.length} .ts files in ${tempSrcDir}:`);
      tsFiles.forEach((file) => console.log(`- ${file}`));

      const tscCommand = `npx tsc ${tsFiles.join(" ")} --outDir ${join(
        process.cwd(),
        "dist/temp"
      )} --module ESNext --target ESNext --sourceMap --moduleResolution bundler --baseUrl ${process.cwd()}`;
      console.log(`Command: ${tscCommand}`);
      execSync(tscCommand, { stdio: "inherit" });
      success = true;
    } catch (error) {
      console.error(
        `TypeScript compilation attempt ${retries + 1} failed:`,
        error
      );
      retries++;
      if (retries < maxRetries) {
        console.log(`Retrying compilation (${retries + 1}/${maxRetries})...`);
        execSync("sleep 0.5");
      } else {
        console.error("TypeScript compilation failed after maximum retries.");
        throw error;
      }
    }
  }
}

export async function generateDeclarations() {
  console.log("Generating declarations...");
  const dtsBundle = await rollup({
    input: "src/client/quickbaseClient.ts", // Fixed path
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
