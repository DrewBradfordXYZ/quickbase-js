#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";

export function writeFileSafe(
  filePath: string,
  content: string,
  encoding: BufferEncoding = "utf8"
): void {
  console.log(`writeFileSafe: Writing to ${filePath}`);
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    console.log(`writeFileSafe: Creating directory ${dir}`);
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, content, encoding);
}

export function runTask(taskName: string, task: () => void): void {
  console.log(`runTask: Starting ${taskName}`);
  try {
    task();
    console.log(`runTask: ${taskName} completed`);
  } catch (error) {
    console.error(`runTask: Error in ${taskName}:`, error);
    process.exit(1);
  }
}
