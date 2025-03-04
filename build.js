#!/usr/bin/env node
const { readFile, writeFile } = require("fs/promises");
const { execSync } = require("child_process");
const esbuild = require("esbuild");
const pkg = require("./package.json");

async function build() {
  try {
    // Compile TypeScript
    console.log("Compiling TypeScript...");
    execSync("npx tsc -b", { stdio: "inherit" });

    // Format with Prettier
    console.log("Formatting files with Prettier...");
    execSync("npx prettier --write src/**/*.ts dist/**/*.js", {
      stdio: "inherit",
    });

    // Bundle for Browser
    console.log("Bundling for Browser...");
    await esbuild.build({
      entryPoints: ["dist/QuickBaseClient.js"],
      bundle: true,
      minify: true,
      sourcemap: true,
      target: ["es2015"],
      outfile: "dist/quickbase-client.browser.min.js",
    });

    // Load Sources
    console.log("Loading Sources...");
    const browserSource = await readFile(
      "dist/quickbase-client.browser.min.js",
      "utf8"
    );
    const cjsSource = await readFile("dist/QuickBaseClient.js", "utf8");
    const license = await readFile("LICENSE", "utf8");

    // Build Header
    console.log("Adding Metadata...");
    const header = [
      "/*! ",
      ` * ${pkg.name} v${pkg.version}`,
      ` * ${pkg.description || "A QuickBase API Client"}`,
      ` * License: ${pkg.license}`,
      ` * ${license}`,
      " */",
    ].join("\n");

    // Write Output Files
    await Promise.all([
      writeFile(
        "dist/quickbase-client.browser.min.js",
        header + "\n" + browserSource
      ),
      writeFile("dist/QuickBaseClient.js", header + "\n" + cjsSource),
    ]);

    console.log("Build completed successfully.");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
