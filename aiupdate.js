import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = "./";
const excludeDirs = ["node_modules", "dist", ".git"];

// List of important files whose contents you want to include (modify this list as needed)
const importantFiles = [
  "package.json",
  "tsconfig.json",
  "src/QuickBaseClient.ts",
  "/types/QuickBaseTypes.ts",
  "code-generation/fix-spec.js",
  "code-generation/regenerate-client.js",
  "src/generated/QuickbaseMethods.ts",
  "src/generate-types.ts",

  // Add more files here, e.g., "src/index.ts", "config.json", etc.
];

// Project Goals as plain text (edit this block directly)
const projectGoals = `Project Goals:
- Implement a QuickBase API client in TypeScript.
- Generate client methods from the QuickBase RESTful API spec.
- Provide a simple and intuitive interface for interacting with QuickBase.
- This libray should not have to manually update the client methods when the QuickBase API changes.
- Generate aegonomic client methods from the QuickBase RESTful API spec that does not require manual updates.
- Support both Node.js and browser environments.
- The intent is to use this in JS frameworks like React, Vue, and Angular.
- use fetch API for making HTTP requests and avoid axios with the openapi generator.
- Use the OpenAPI to generate the typescript types and methods.
- Use the lates ES6+ features and TypeScript features.
`;
// End of editable text block

function buildTree(dir, prefix = "") {
  let tree = "";
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file, index) => {
    const isLast = index === files.length - 1;
    const marker = isLast ? "└─" : "├─";
    const filePath = path.join(dir, file.name);
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, "/"); // Normalize to forward slashes

    if (file.isDirectory() && excludeDirs.includes(file.name)) return;

    tree += `${prefix}${marker} ${file.name}${file.isDirectory() ? "/" : ""}\n`;

    // If it's a file and in the importantFiles list (using relative path), append its contents
    if (!file.isDirectory() && importantFiles.includes(relativePath)) {
      try {
        const contents = fs.readFileSync(filePath, "utf8");
        tree += `${prefix}${isLast ? "  " : "│ "}  Contents:\n`;
        // Indent contents for readability
        tree += contents
          .split("\n")
          .map((line) => `${prefix}${isLast ? "  " : "│ "}    ${line}`)
          .join("\n");
        tree += "\n"; // Add a newline after contents
      } catch (err) {
        tree += `${prefix}${isLast ? "  " : "│ "}  [Error reading file: ${err.message}]\n`;
      }
    }

    if (file.isDirectory()) {
      const newPrefix = prefix + (isLast ? "  " : "│ ");
      tree += buildTree(filePath, newPrefix);
    }
  });

  return tree;
}

function generateTreeSnapshot() {
  let snapshot = `[quickbase-js] Tree - ${new Date().toLocaleDateString()}\n`;
  snapshot += `Root: ${path.resolve(rootDir)}\n\n`;
  snapshot += projectGoals; // Insert Project Goals directly
  snapshot += "\n\n"; // Add spacing after goals
  snapshot += buildTree(rootDir);
  return snapshot;
}

const output = generateTreeSnapshot();
fs.writeFileSync("aiupdate.txt", output);
const lineCount = output.split("\n").length;
console.log("aiupdate.txt");
console.log(`Lines: ${lineCount}`);
