/**
 * Integration test setup utilities
 *
 * Provides shared configuration and helpers for integration tests.
 * Credentials are loaded from .env file (gitignored).
 *
 * Creates an ephemeral QuickBase app per test run - no pre-existing app needed.
 * The app is automatically cleaned up after tests complete.
 */

import { createClient, QuickbaseClient } from '../../src/index.js';
import { config } from 'dotenv';

// Load .env file (quiet mode to suppress logs)
config({ quiet: true });

export const QB_REALM = process.env.QB_REALM;
export const QB_USER_TOKEN = process.env.QB_USER_TOKEN;

export const hasCredentials = !!(QB_REALM && QB_USER_TOKEN);

/**
 * Returns true if credentials are missing (used with describe.skipIf)
 */
export function skipIfNoCredentials(): boolean {
  if (!hasCredentials) {
    console.log('Skipping integration tests: QB_REALM or QB_USER_TOKEN not set');
  }
  return !hasCredentials;
}

/**
 * Create a QuickBase client configured for integration tests
 */
export function createTestClient(): QuickbaseClient {
  if (!hasCredentials) {
    throw new Error('Missing QB_REALM or QB_USER_TOKEN environment variables');
  }
  return createClient({
    realm: QB_REALM!,
    auth: { type: 'user-token', userToken: QB_USER_TOKEN! },
    debug: false,
  });
}

/**
 * Test context shared across all test files
 * Populated by globalSetup.ts, read from .test-context.json
 */
export interface TestContext {
  appId: string;
  tableId: string;
  textFieldId: number;
  numberFieldId: number;
  dateFieldId: number;
  checkboxFieldId: number;
}

/** Path to the test context file */
export const TEST_CONTEXT_PATH = 'tests/integration/.test-context.json';

/** Prefix for ephemeral test app names */
export const TEST_APP_PREFIX = 'test-v2-';
