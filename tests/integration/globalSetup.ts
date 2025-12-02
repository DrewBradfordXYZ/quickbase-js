/**
 * Global setup/teardown for integration tests
 *
 * Creates an ephemeral QuickBase app per test run.
 *
 * Runs once before all tests:
 * 1. Cleans up any orphaned test app from previous failed runs
 * 2. Creates a fresh test app with a table and fields
 * 3. Writes context to .test-context.json for test files to read
 *
 * After tests complete:
 * - App is left for inspection
 * - Deleted automatically at the START of the next test run
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { createTestClient, hasCredentials, TEST_CONTEXT_PATH, TEST_APP_PREFIX, TestContext } from './setup.js';

/**
 * Called by Vitest before all tests run
 */
export async function setup(): Promise<void> {
  if (!hasCredentials) {
    console.log('\n⚠️  No credentials - skipping integration test setup');
    console.log('   Set QB_REALM and QB_USER_TOKEN in .env to run integration tests\n');
    return;
  }

  const client = createTestClient();

  // Auto-cleanup: Delete orphaned app from previous failed run
  console.log('🧹 Checking for orphaned test apps...');
  await cleanupOrphanedApp(client);

  // Create fresh test app
  const appName = `${TEST_APP_PREFIX}${Date.now()}`;
  console.log(`📱 Creating test app: ${appName}`);

  const app = await client.createApp({
    name: appName,
    description: 'Integration test app - safe to delete',
    assignToken: true,
  });
  const appId = app.id!;
  console.log(`   App created: ${appId}`);

  // Create test table
  console.log('📋 Creating test table...');
  const table = await client.createTable(
    { appId },
    { name: 'TestRecords', description: 'Integration test table' }
  );
  const tableId = table.id!;
  console.log(`   Table created: ${tableId}`);

  // Create test fields
  console.log('🔧 Creating test fields...');
  const textField = await client.createField(
    { tableId },
    { label: 'Name', fieldType: 'text' }
  );
  const numberField = await client.createField(
    { tableId },
    { label: 'Amount', fieldType: 'numeric' }
  );
  const dateField = await client.createField(
    { tableId },
    { label: 'EventDate', fieldType: 'date' }
  );
  const checkboxField = await client.createField(
    { tableId },
    { label: 'IsActive', fieldType: 'checkbox' }
  );
  console.log(`   Fields created: text=${textField.id}, numeric=${numberField.id}, date=${dateField.id}, checkbox=${checkboxField.id}`);

  // Write context for test files
  const ctx: TestContext = {
    appId,
    tableId,
    textFieldId: textField.id!,
    numberFieldId: numberField.id!,
    dateFieldId: dateField.id!,
    checkboxFieldId: checkboxField.id!,
  };
  writeFileSync(TEST_CONTEXT_PATH, JSON.stringify(ctx, null, 2));

  console.log('✅ Test environment ready\n');
}

/**
 * Delete orphaned test app from a previous failed run
 */
async function cleanupOrphanedApp(client: ReturnType<typeof createTestClient>): Promise<void> {
  if (!existsSync(TEST_CONTEXT_PATH)) {
    console.log('   No orphaned apps found');
    return;
  }

  try {
    const oldContext: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    console.log(`   Found orphaned app: ${oldContext.appId}, deleting...`);

    try {
      // Need app name to delete - try to fetch it first
      const app = await client.getApp({ appId: oldContext.appId });
      await client.deleteApp({ appId: oldContext.appId }, { name: app.name! });
      console.log('   Orphaned app deleted');
    } catch {
      console.log('   Could not delete orphaned app (may already be deleted)');
    }

    unlinkSync(TEST_CONTEXT_PATH);
  } catch {
    console.log('   Cleanup check failed, continuing');
  }
}

/**
 * Called by Vitest after all tests complete
 *
 * Leaves the app for inspection - it will be deleted at the start of the next run
 */
export async function teardown(): Promise<void> {
  if (!hasCredentials) {
    return;
  }

  if (!existsSync(TEST_CONTEXT_PATH)) {
    return;
  }

  const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
  console.log(`\n📌 Test app preserved for inspection: ${ctx.appId}`);
  console.log('   Will be deleted at the start of the next test run\n');
}
