import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for integration tests
 *
 * Uses globalSetup to create ephemeral test app before tests
 * and globalTeardown to delete it after tests complete.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    // Global setup creates test app, teardown deletes it
    globalSetup: './tests/integration/globalSetup.ts',
    // Integration tests need longer timeouts for real API calls
    testTimeout: 30000,
    hookTimeout: 60000,
    // Run tests sequentially - they share a table
    sequence: {
      concurrent: false,
    },
    // Run test files sequentially too
    fileParallelism: false,
  },
});
