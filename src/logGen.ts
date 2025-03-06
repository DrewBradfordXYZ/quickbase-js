#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir: string = "./";
const excludeDirs: string[] = ["node_modules", ".git"];

// List of important files whose contents you want to include
const importantFiles: string[] = [
  "logGen.ts",
  "package.json",
  "tsconfig.json",
  "tsconfig.build.json",
  "src/code-generation/fix-spec.ts",
  "src/code-generation/regenerate-client.ts",
  "src/test.ts",
  "src/QuickbaseClient.ts",
  "src/types/QuickbaseClient.d.ts", // Fixed typo from "/types/QuickBaseTypes.ts"
  "src/generated/apis/FieldsApi.ts",
];

// Project Goals as plain text
const projectGoals: string = `Project Goals:
- Implement a QuickBase API client in TypeScript.
- Generate client methods from the QuickBase RESTful API spec.
- Provide a simple and intuitive interface for interacting with QuickBase.
- This library should not have to manually update the client methods when the QuickBase API changes.
- Generate ergonomic client methods from the QuickBase RESTful API spec that do not require manual updates.
- Support both Node.js and browser environments.
- The intent is to use this in JS frameworks like React, Vue, and Angular.
- Use the Fetch API for making HTTP requests and avoid Axios with the OpenAPI Generator.
- Use OpenAPI to generate the TypeScript types and methods.
- Use the latest ES6+ features and TypeScript features.
`;

function buildTree(dir: string, prefix: string = ""): string {
  let tree: string = "";
  const files: fs.Dirent[] = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file: fs.Dirent, index: number) => {
    const isLast: boolean = index === files.length - 1;
    const marker: string = isLast ? "└─" : "├─";
    const filePath: string = path.join(dir, file.name);
    const relativePath: string = path
      .relative(rootDir, filePath)
      .replace(/\\/g, "/");

    if (file.isDirectory() && excludeDirs.includes(file.name)) return;

    tree += `${prefix}${marker} ${file.name}${file.isDirectory() ? "/" : ""}\n`;

    if (!file.isDirectory() && importantFiles.includes(relativePath)) {
      try {
        const contents: string = fs.readFileSync(filePath, "utf8");
        tree += `${prefix}${isLast ? "  " : "│ "}  Contents:\n`;
        tree += contents
          .split("\n")
          .map((line: string) => `${prefix}${isLast ? "  " : "│ "}    ${line}`)
          .join("\n");
        tree += "\n";
      } catch (err: unknown) {
        tree += `${prefix}${isLast ? "  " : "│ "}  [Error reading file: ${
          (err as Error).message
        }]\n`;
      }
    }

    if (file.isDirectory()) {
      const newPrefix: string = prefix + (isLast ? "  " : "│ ");
      tree += buildTree(filePath, newPrefix);
    }
  });

  return tree;
}

function generateTreeSnapshot(): string {
  let snapshot: string = `[quickbase-js] Tree - ${new Date().toLocaleDateString()}\n`;
  snapshot += `Root: ${path.resolve(rootDir)}\n\n`;
  snapshot += projectGoals;
  snapshot += "\n\n";
  snapshot += buildTree(rootDir);
  return snapshot;
}

try {
  const output: string = generateTreeSnapshot();
  fs.writeFileSync("logGen.txt", output, "utf8");
  const lineCount: number = output.split("\n").length - 1; // Exclude trailing newline
  console.log("logGen.txt");
  console.log(`Lines: ${lineCount}`);
} catch (error: unknown) {
  console.error("Failed to generate tree snapshot:", (error as Error).message);
  process.exit(1);
}
