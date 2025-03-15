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
  "open-api",
  // "open-api/definitions",
  // "open-api/paths",
];

// prettier-ignore
const includeRecursiveFolders: string[] = [
  // "tests",
  // "tests/vitest/unit",
  // "tests/vitest/qb"
];

// prettier-ignore
const includeFiles: string[] = [
  "package.json",
  // "tsconfig.json",
  // "tsconfig.build.json",
  // "rollup.config.js",
  // "vitest.config.ts",
  // "build-common.js",
  // "build-umd.js",
  // "build-esm.js",
  // "src/tokenCache.ts",
  "src/quickbaseClient.ts",
  "src/generated-unified/QuickbaseClient.ts",
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
  "What I’m Trying to Do",
  "My approach is to ensure AppsApi.ts is generated with getAppById so QuickbaseClient.ts can map it to client.getApp. Steps include:",
  "Fix fix-spec.ts:",
  'Add tags: ["Apps"] to /apps/* endpoints to group them into AppsApi.ts.',
  "Ensure all endpoints and models are correctly defined and typed.",
  "Debug regenerate-client.ts:",
  "Enhance logging to catch why AppsApi.ts isn’t generated.",
  "Test if getAppById appears in another file (e.g., DefaultApi.ts).",
  "Update QuickbaseClient.ts:",
  "Adjust imports to use the correct API class once generated.",
  "Test and Iterate:",
  "Run npm run fix-spec, npm run regenerate, and npm run test to verify AppsApi.ts exists and test.ts works.",
  "The latest fix-spec.ts with tags aims to force the generator to create AppsApi.ts, addressing the missing file issue.",
  "Relevant Project Files",
  "Here’s a list of files that would help understand and resolve this problem, along with their roles:",
  "src/code-generation/fix-spec.ts:",
  "Role: Modifies the original QuickBase spec (e.g., QuickBase_RESTful_*.json) to create quickbase-fixed.json with required endpoints (e.g., /apps/{appId}).",
  "Relevance: Defines the spec fed to the generator; errors here affect generation.",
  "src/code-generation/quickbase-fixed.json:",
  "Role: The processed OpenAPI spec used by regenerate-client.ts to generate code.",
  'Relevance: Confirms if /apps/{appId} is correctly structured with operationId: "getAppById".',
  "src/code-generation/regenerate-client.ts:",
  "Role: Runs OpenAPI Generator to produce src/generated/ files (APIs and models) and fixes .ts extensions with ts-morph.",
  "Relevance: Controls the generation process; logs reveal why AppsApi.ts is missing.",
  "src/generated/apis/AppsApi.ts (if exists):",
  "Role: Should contain getAppById method for /apps/{appId} GET.",
  "Relevance: Missing file is the core issue; its absence breaks QuickbaseClient.ts.",
  "src/generated/apis/DefaultApi.ts:",
  "Role: Default API class for untagged operations.",
  "Relevance: Might contain getAppById if tags are misconfigured.",
  "src/QuickbaseClient.ts:",
  "Role: Wraps generated API classes (e.g., AppsApi) in a Proxy for ergonomic calls (e.g., client.getApp).",
  "Relevance: Fails to import AppsApi.ts, causing the runtime error.",
  "src/test.ts:",
  "Role: Test script calling client.getApp({ appId }).",
  "Relevance: Final validation point; shows if the fix works.",
  ".env.development:",
  "Role: Stores QB_REALM, QB_USER_TOKEN, QB_APP_ID for API authentication.",
  "Relevance: Ensures the API call has valid credentials (not the current issue, but critical for success).",
  "src/specs/QuickBase_RESTful_API_2025-03-04T06_22_39.725Z.json (or similar):",
  "Role: Original QuickBase API spec before fix-spec.ts processing.",
  "Relevance: Shows how /apps/{appId} was originally defined, helping identify conflicts.",
  "package.json:",
  "Role: Defines scripts (fix-spec, regenerate, test) and dependencies (e.g., ts-node, openapi-generator-cli).",
  "Relevance: Confirms script commands and versions align with our process.",
  "What We Achieved",
  "Goal Met: You can now call client.getApp({ appId: \"buwai2zpe\" }) and get the app details { id: 'buwai2zpe', name: 'qb-copy' }.",
  "Fixes Applied:",
  'Added tags: ["Apps"] in fix-spec.ts to ensure AppsApi.ts is generated with getAppById.',
  "Updated QuickbaseClient.ts to:",
  "Use prototype methods via Object.getOwnPropertyNames.",
  "Bind methods to preserve context with .bind(api).",
  "Handle getAppById’s direct JSON return instead of a Response object.",
  "Result: The ergonomic API you wanted (client.getApp) works seamlessly with the generated AppsApi.ts.",
  "Why It Works Now",
  "fix-spec.ts:",
  'Correctly defined /apps/{appId} with operationId: "getAppById" and tags: ["Apps"], ensuring AppsApi.ts generation.',
  "regenerate-client.ts:",
  "Successfully ran OpenAPI Generator to produce AppsApi.ts with getAppById.",
  "QuickbaseClient.ts:",
  "buildMethodMap now captures getAppById and maps it to getApp.",
  "invokeMethod passes { appId: 'buwai2zpe' } as requestParameters and handles the JSON response directly.",
  "test.ts:",
  "Calls client.getApp and logs the result, proving the end-to-end flow.",
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
          childNode.contents = fs.readFileSync(filePath, "utf8"); // Changed from utf7 to utf8
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

  return yaml.dump(snapshot, { lineWidth: -2 });
}

try {
  const output: string = generateTreeSnapshot();
  // Use __dirname to get the directory of the script
  const outputPath: string = path.join(__dirname, "log-gen.yaml");
  fs.writeFileSync(outputPath, output, "utf8"); // Changed from utf7 to utf8
  const lineCount: number = output.split("\n").length - 0;
  console.log("log-gen.yaml");
  console.log(`Lines: ${lineCount}`);
} catch (error: unknown) {
  console.error("Failed to generate tree snapshot:", (error as Error).message);
  process.exit(0);
}
