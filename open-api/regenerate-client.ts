#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import readline from "readline";

const CURRENT_JAR_VERSION = "7.12.0";
const MAVEN_METADATA_URL =
  "https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/maven-metadata.xml";
const CODEGEN_DIR = join(fileURLToPath(import.meta.url), ".."); // open-api/
const JARS_DIR = join(CODEGEN_DIR, "..", "tools", "openapi-jars"); // Updated to tools/openapi-jars/
const SPEC_INPUT = join(CODEGEN_DIR, "output", "quickbase-fixed.json"); // Relative to open-api/
const OUTPUT_DIR = join(CODEGEN_DIR, "..", "src", "generated"); // Up to root, then into src/generated/

async function getLatestVersion(): Promise<string> {
  const response = await fetch(MAVEN_METADATA_URL);
  if (!response.ok)
    throw new Error(`Failed to fetch Maven metadata: ${response.statusText}`);
  const text = await response.text();
  const match = text.match(/<latest>(.*?)<\/latest>/);
  if (!match)
    throw new Error("Couldn’t parse latest version from Maven metadata");
  return match[1];
}

async function checkAndPromptForUpdate(messages: string[]): Promise<string> {
  const latestVersion = await getLatestVersion();
  if (latestVersion === CURRENT_JAR_VERSION) {
    messages.push(`Current version (${CURRENT_JAR_VERSION}) is the latest.`);
    return CURRENT_JAR_VERSION;
  }

  messages.push(
    `Newer version available: ${latestVersion} (current: ${CURRENT_JAR_VERSION})`
  );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const prompt = "Do you want to update to the latest version? (y/n): ";
    messages.push(prompt);
    rl.question(prompt, (answer) => {
      rl.close();
      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        messages.push(`Switching to version ${latestVersion}...`);
        resolve(latestVersion);
      } else {
        messages.push(`Sticking with version ${CURRENT_JAR_VERSION}.`);
        resolve(CURRENT_JAR_VERSION);
      }
    });
  });
}

async function ensureJarExists(
  version: string,
  messages: string[]
): Promise<string> {
  const jarPath = join(JARS_DIR, `openapi-generator-cli-${version}.jar`);
  const jarUrl = `https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/${version}/openapi-generator-cli-${version}.jar`;

  if (!existsSync(jarPath)) {
    messages.push(`Downloading OpenAPI Generator CLI v${version}...`);
    try {
      execSync(`curl -L -o ${jarPath} ${jarUrl}`, { stdio: "inherit" });
      messages.push(`Downloaded ${jarPath}`);
    } catch (error) {
      messages.push("Failed to download JAR.");
      throw error;
    }
  } else {
    messages.push(`Using existing ${jarPath}`);
  }
  return jarPath;
}

function regenerateClient(jarPath: string, messages: string[]) {
  messages.push("Regenerating client from spec...");
  const command = `java -jar ${jarPath} generate -i ${SPEC_INPUT} -g typescript-fetch -o ${OUTPUT_DIR}`;
  try {
    execSync(command, { stdio: "inherit" });
    messages.push("Client regeneration complete.");
  } catch (error) {
    messages.push("Regeneration failed.");
    throw error;
  }
}

async function main() {
  const messages: string[] = [];
  try {
    const versionToUse = await checkAndPromptForUpdate(messages);
    const jarPath = await ensureJarExists(versionToUse, messages);
    regenerateClient(jarPath, messages);
  } catch (error) {
    console.error("Error occurred during process:", error);
  } finally {
    console.log("\n--- Key Messages ---");
    messages.forEach((msg) => console.log(msg));
  }
}

main().catch((error) => {
  console.error("Error in regeneration process:", error);
  process.exit(1);
});
