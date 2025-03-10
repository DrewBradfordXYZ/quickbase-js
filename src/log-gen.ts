#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml"; // Requires "js-yaml": "^4.1.0" in package.json

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir: string = "./";
const excludeDirs: string[] = ["node_modules", ".git"];

const importantFolders: string[] = [];

const importantFiles: string[] = [
  "package.json",
  "tsconfig.json",
  "rollup.config.js",
  "vitest.config.ts",
  "generated-unified/QuickbaseClient.ts",
  "src/quickbaseClient.ts",
  "src/tokenCache.ts",
  "src/code-generation/fix-spec-main.ts",
  "src/code-generation/fix-spec-paths.ts",
  "src/code-generation/fix-spec-definitions.ts",
  "src/code-generation/regenerate-client.ts",
  "src/code-generation/generate-unified-interface.ts",
];

const projectGoals: string[] = [
  "Implement a QuickBase API client in TypeScript.",
  "Generate client methods from the QuickBase RESTful API spec.",
  "Provide a simple and intuitive interface for interacting with QuickBase.",
  "Support both Node.js and browser environments.",
  "Use case: JS frameworks like React, Vue, and Angular hosted in QuickBase code pages.",
  "Node.js is supported using User Tokens",
  "Use OpenAPI to generate the TypeScript types and methods.",
  "Use the latest ES6+ features and TypeScript features.",
  "#",
  "No manual updating methods when the QuickBase API changes.",
  "The proxy magic dynamically maps generated methods.",
  "No manual endpoint definitions—endpoints come from the generated apis (e.g., AppsApi.getApp).",
  "#",
  "Per-Instance Store: tokenCache is defined per quickbaseClient call, so each instance has its own isolated TokenCache.",
  "No Singleton: No shared state—tokens are fetched and cached within the current instance.",
];

interface TreeNode {
  name: string;
  type: "directory" | "file";
  contents?: string;
  children?: TreeNode[];
}

function buildTree(dir: string): TreeNode {
  const node: TreeNode = {
    name: path.basename(dir) || "",
    type: "directory",
    children: [],
  };

  const files: fs.Dirent[] = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file: fs.Dirent) => {
    const filePath: string = path.join(dir, file.name);
    const relativePath: string = path
      .relative(rootDir, filePath)
      .replace(/\\/g, "/");

    if (file.isDirectory() && excludeDirs.includes(file.name)) return;

    const childNode: TreeNode = {
      name: file.name,
      type: file.isDirectory() ? "directory" : "file",
    };

    if (file.isDirectory()) {
      childNode.children = buildTree(filePath).children;
    } else {
      const isInImportantFolder = importantFolders.some(
        (folder) =>
          relativePath.startsWith(folder + "/") || relativePath === folder
      );
      if (importantFiles.includes(relativePath) || isInImportantFolder) {
        try {
          childNode.contents = fs.readFileSync(filePath, "utf8");
        } catch (err: unknown) {
          childNode.contents = `[Error reading file: ${
            (err as Error).message
          }]`;
        }
      }
    }

    node.children!.push(childNode);
  });

  return node;
}

function generateTreeSnapshot(): string {
  const snapshot = {
    project: "quickbase-js",
    date: new Date().toLocaleDateString(),
    root: path.resolve(rootDir),
    goals: projectGoals,
    tree: buildTree(rootDir),
  };

  return yaml.dump(snapshot, { lineWidth: -1 }); // No line wrapping for readability
}

try {
  const output: string = generateTreeSnapshot();
  fs.writeFileSync("logGen.yaml", output, "utf8");
  const lineCount: number = output.split("\n").length - 1; // Exclude trailing newline
  console.log("logGen.yaml");
  console.log(`Lines: ${lineCount}`);
} catch (error: unknown) {
  console.error("Failed to generate tree snapshot:", (error as Error).message);
  process.exit(1);
}
