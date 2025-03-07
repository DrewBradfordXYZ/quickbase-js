#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch"; // Requires "node-fetch": "^3.3.2" in package.json
import readline from "readline";

// Configuration
const CURRENT_JAR_VERSION = "7.12.0"; // Your current version as of March 2025
const MAVEN_METADATA_URL =
  "https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/maven-metadata.xml";
const JAR_PATH = join(
  join(fileURLToPath(import.meta.url), ".."),
  "openapi-generator-cli.jar"
);
const SPEC_INPUT = join(
  join(fileURLToPath(import.meta.url), ".."),
  "quickbase-fixed.json"
);
const OUTPUT_DIR = join(
  join(fileURLToPath(import.meta.url), ".."),
  "..",
  "generated"
);

async function getLatestVersion(): Promise<string> {
  const response = await fetch(MAVEN_METADATA_URL);
  if (!response.ok)
    throw new Error(`Failed to fetch Maven metadata: ${response.statusText}`);
  const text = await response.text();
  const match = text.match(/<latest>(.*?)<\/latest>/);
  if (!match)
    throw new Error("Couldn’t parse latest version from Maven metadata");
  return match[1]; // e.g., "7.12.0" or newer
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
    messages.push(prompt); // Log the prompt
    rl.question(prompt, (answer) => {
      rl.close();
      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        messages.push(`Updating to version ${latestVersion}...`);
        resolve(latestVersion);
      } else {
        messages.push(`Sticking with version ${CURRENT_JAR_VERSION}.`);
        resolve(CURRENT_JAR_VERSION);
      }
    });
  });
}

async function ensureJarExists(version: string, messages: string[]) {
  const jarUrl = `https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/${version}/openapi-generator-cli-${version}.jar`;
  if (!existsSync(JAR_PATH)) {
    messages.push(`Downloading OpenAPI Generator CLI v${version}...`);
    try {
      execSync(`curl -L -o ${JAR_PATH} ${jarUrl}`, { stdio: "inherit" });
      messages.push(`Downloaded ${JAR_PATH}`);
    } catch (error) {
      messages.push("Failed to download JAR.");
      throw error;
    }
  } else if (version !== CURRENT_JAR_VERSION) {
    // If updating to a new version, remove the old .jar first
    messages.push(`Removing existing JAR to update to v${version}...`);
    unlinkSync(JAR_PATH);
    messages.push(`Downloading OpenAPI Generator CLI v${version}...`);
    try {
      execSync(`curl -L -o ${JAR_PATH} ${jarUrl}`, { stdio: "inherit" });
      messages.push(`Downloaded ${JAR_PATH}`);
    } catch (error) {
      messages.push("Failed to download JAR.");
      throw error;
    }
  } else {
    messages.push(`Using existing ${JAR_PATH}`);
  }
}

function regenerateClient(messages: string[]) {
  messages.push("Regenerating client from spec...");
  const command = `java -jar ${JAR_PATH} generate -i ${SPEC_INPUT} -g typescript-fetch -o ${OUTPUT_DIR}`;
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
    await ensureJarExists(versionToUse, messages);
    regenerateClient(messages);
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
