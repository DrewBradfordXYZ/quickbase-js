/**
 * Common utilities for spec tooling
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Project root is 2 levels up from scripts/spec
const projectRoot = join(__dirname, '..', '..');

/** Paths - specDir points to the symlinked spec directory */
export const PATHS = {
  specDir: join(projectRoot, 'spec'),
  source: join(projectRoot, 'spec', 'source'),
  overrides: join(projectRoot, 'spec', 'overrides'),
  output: join(projectRoot, 'spec', 'output'),
  fixtures: join(projectRoot, 'spec', 'fixtures'),
  // Generated output goes into src/generated
  generated: join(projectRoot, 'src', 'generated'),
};

/**
 * Read a JSON file
 */
export function readJson<T = unknown>(path: string): T {
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Write a JSON file with formatting
 */
export function writeJson(path: string, data: unknown): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Read a YAML file (requires yaml package)
 */
export async function readYaml<T = unknown>(path: string): Promise<T> {
  const yaml = await import('yaml');
  const content = readFileSync(path, 'utf-8');
  return yaml.parse(content) as T;
}

/**
 * Write a YAML file
 */
export async function writeYaml(path: string, data: unknown): Promise<void> {
  const yaml = await import('yaml');
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, yaml.stringify(data));
}

/**
 * Find the source Swagger spec file
 */
export function findSourceSpec(): string | null {
  const sourceDir = PATHS.source;
  if (!existsSync(sourceDir)) {
    return null;
  }

  // Look for the main swagger file
  const swaggerPath = join(sourceDir, 'quickbase-swagger.json');
  if (existsSync(swaggerPath)) {
    return swaggerPath;
  }

  // Fallback: look for any QuickBase spec files
  const { readdirSync } = require('fs');
  const files = readdirSync(sourceDir) as string[];

  const specFiles = files
    .filter((f: string) => f.includes('QuickBase') && f.endsWith('.json'))
    .sort()
    .reverse();

  return specFiles.length > 0 ? join(sourceDir, specFiles[0]) : null;
}

/**
 * Log with timestamp and color
 */
export function log(level: 'info' | 'warn' | 'error' | 'success', message: string): void {
  const colors = {
    info: '\x1b[36m',    // cyan
    warn: '\x1b[33m',    // yellow
    error: '\x1b[31m',   // red
    success: '\x1b[32m', // green
  };
  const reset = '\x1b[0m';
  const prefix = {
    info: 'INFO',
    warn: 'WARN',
    error: 'ERROR',
    success: 'OK',
  };

  console.log(`${colors[level]}[${prefix[level]}]${reset} ${message}`);
}

/**
 * Run a task with timing
 */
export async function runTask<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  log('info', `Starting: ${name}`);

  try {
    const result = await fn();
    const duration = Date.now() - start;
    log('success', `Completed: ${name} (${duration}ms)`);
    return result;
  } catch (error) {
    log('error', `Failed: ${name}`);
    throw error;
  }
}
