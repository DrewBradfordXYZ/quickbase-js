#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir: string = "./";
const excludeDirs: string[] = ["node_modules", ".git", "specs"];

// prettier-ignore
const includeFolders: string[] = [
  // "src/code-generation",
  // "src/code-generation/definitions",
  // "src/code-generation/paths",
];

// prettier-ignore
const includeRecursiveFolders: string[] = [
  // "tests",
  "tests/vitest/unit",
  // "tests/vitest/qb"
];

// prettier-ignore
const includeFiles: string[] = [
  // "package.json",
  // "tsconfig.json",
  // "rollup.config.js",
  // "vitest.config.ts",
  // "src/utils.ts",
  // "src/tokenCache.ts",
  // "src/generated-unified/QuickbaseClient.ts",
  // "src/quickbaseClient.ts",
];

const projectGoals: string[] = [
  "A library for interacting with the QuickBase RESTful API.",
  "Use OpenAPI to generate types and methods using a proxy. Validate with tests.",
  "Provide robust and intuitive temporary token support for browser environments.",
  "User Tokens support both Node.js and browser environments.",
  "Use case: JS frameworks like React, Vue, and Angular hosted in QuickBase code pages.",
  "Enable a flexible or native fetch in the browser.",
  "Enable a flexible fetch framework in Node.js.",
  "#",
  "No manual updating methods when the QuickBase API changes.",
  "The proxy magic dynamically maps generated methods and types.",
  "#",
  "TokenCache is defined per quickbaseClient call, so each instance has its own isolated TokenCache.",
  "Each quickbase client instance has an isolated and individual token cache.",
];

const pipelineOverview: string[] = [
  "fix-spec-main.ts: Input: Reads the latest QuickBase_RESTful*.json file from the specs/ folder and applies fixes to the parameters and paths.",
  "filters out the QB-Realm-Hostname, Authorization, and User-Agent parameters.",
  "Converts parameter names to camelCase.",
  "Fixes array schemas and applies custom paths.",
  "Merges paths from fix-spec-paths.ts and definitions from fix-spec-definitions.ts.",
  "Output: writes quickbase-fixed.json to src/code-generation/output/.",
  "Key Behavior: The merge (spec.paths = { ...spec.paths, ...paths }) preserves all origional endpoints, only overriding those defined in fix-spec-paths.ts.",
  "#",
  "regenerate-client.ts: Uses quickbase-fixed.json to generate raw TypeScript-fetch files (src/generated/). including models and APIs.",
  "#",
  "generate-unified-interface.ts: Uses quickbase-fixed.json to generate a unified QuickbaseClient.ts interface in src/generated-unified/.",
  "QuickbaseClient.ts includes all endpoints from src/code-generation/output/quickbase-fixed, and types from src/generated.",
  "#",
  "/specs/QuickBase_RESTful_API_*.json is over 46k lines of JSON, so it's not included in the snapshot, its too large to give to an AI.",
  "which creates difficulties in understanding the structure of the API.",
  "It makes it difficult to model the src/code-generation/fix-spec-*.ts files in the snapshot.",
  "#",
  "vitest unit and integration tests. Integration tests use the real QuickBase API with user token auth.",
  "playwright is used to test the real QuickBase API in a browser enviornment with temporary token auth.",
  "temp tokens can only be generated in a browser enviornment and can not be fetched with a user token.",
  "#",
  "getTempTokenDBID() method is wrapped to enhance temporary token generation reuse interacting with a token cache.",
  "#",
  "npm run fix-spec: Generates quickbase-fixed.json from the latest QuickBase_RESTful*.json file.",
  "npm run regenerate:openapi Generates raw TypeScript-fetch files in src/generated/.",
  "npm run generate:unified: Generates a unified QuickbaseClient.ts interface in src/generated-unified/.",
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
      const isInIncludeFolder = includeFolders.some((folder) => {
        const folderPath = folder.endsWith("/") ? folder : folder + "/";
        return (
          relativePath.startsWith(folderPath) &&
          relativePath.split("/").length === folderPath.split("/").length
        );
      });

      const isInIncludeRecursiveFolder = includeRecursiveFolders.some(
        (folder) =>
          relativePath.startsWith(folder + "/") || relativePath === folder
      );

      const shouldInclude =
        includeFiles.includes(relativePath) ||
        isInIncludeFolder ||
        isInIncludeRecursiveFolder;

      if (shouldInclude) {
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
    pipelineOverview: pipelineOverview,
    tree: buildTree(rootDir),
  };

  return yaml.dump(snapshot, { lineWidth: -1 });
}

try {
  const output: string = generateTreeSnapshot();
  fs.writeFileSync("log-gen.yaml", output, "utf8");
  const lineCount: number = output.split("\n").length - 1;
  console.log("log-gen.yaml");
  console.log(`Lines: ${lineCount}`);
} catch (error: unknown) {
  console.error("Failed to generate tree snapshot:", (error as Error).message);
  process.exit(1);
}
