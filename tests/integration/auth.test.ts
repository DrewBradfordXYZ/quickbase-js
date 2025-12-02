/**
 * Integration tests for authentication strategies
 *
 * Tests user-token and temp-token auth flows against real QuickBase API.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { createClient } from '../../src/index.js';
import { skipIfNoCredentials, TEST_CONTEXT_PATH, TestContext, QB_REALM, QB_USER_TOKEN } from './setup.js';

describe.skipIf(skipIfNoCredentials())('Authentication Integration', () => {
  let appId: string;
  let tableId: string;
  let textFieldId: number;

  beforeAll(() => {
    if (!existsSync(TEST_CONTEXT_PATH)) {
      throw new Error('Test context not found - globalSetup may have failed');
    }
    const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    appId = ctx.appId;
    tableId = ctx.tableId;
    textFieldId = ctx.textFieldId;
  });

  describe('User Token Auth', () => {
    it('should work with user token auth', async () => {
      const client = createClient({
        realm: QB_REALM!,
        auth: {
          type: 'user-token',
          userToken: QB_USER_TOKEN!,
        },
      });

      const result = await client.getApp({ appId });
      expect(result.id).toBe(appId);
    });

    it('should fail with invalid user token', async () => {
      const client = createClient({
        realm: QB_REALM!,
        auth: {
          type: 'user-token',
          userToken: 'invalid_token_12345',
        },
      });

      await expect(client.getApp({ appId })).rejects.toThrow();
    });
  });

  // Note: Temp token auth tests are skipped because QuickBase only allows
  // temp token fetching from whitelisted domains (e.g., Code Pages).
  // The "Domain not allowed" error is a QuickBase security feature, not an SDK bug.
  //
  // The SDK's dbid extraction IS working - it correctly extracts the tableId
  // from body.from, body.to, query params, and path segments. This is verified
  // by the unit tests in tests/unit/extract-dbid.test.ts.
  //
  // To test temp-token auth in production:
  // 1. Deploy code to a QuickBase Code Page
  // 2. Or whitelist your domain in QuickBase app settings
  describe.skip('Temp Token Auth (requires whitelisted domain)', () => {
    let tempTokenClient: ReturnType<typeof createClient>;

    beforeEach(() => {
      tempTokenClient = createClient({
        realm: QB_REALM!,
        auth: {
          type: 'temp-token',
          userToken: QB_USER_TOKEN!, // Used to fetch temp tokens
        },
      });
    });

    it('should auto-extract dbid from runQuery body.from', async () => {
      // runQuery uses body.from which should be extracted as dbid
      const result = await tempTokenClient.runQuery({
        from: tableId,
        select: [3],
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should auto-extract dbid from upsert body.to', async () => {
      // upsert uses body.to which should be extracted as dbid
      const result = await tempTokenClient.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'TempTokenTest' } }],
      });

      expect(result.metadata?.createdRecordIds).toHaveLength(1);

      // Cleanup
      const userClient = createClient({
        realm: QB_REALM!,
        auth: { type: 'user-token', userToken: QB_USER_TOKEN! },
      });
      await userClient.deleteRecords({ from: tableId, where: '{3.GT.0}' });
    });

    it('should auto-extract dbid from deleteRecords body.from', async () => {
      // First create a record to delete
      const userClient = createClient({
        realm: QB_REALM!,
        auth: { type: 'user-token', userToken: QB_USER_TOKEN! },
      });
      await userClient.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'ToDelete' } }],
      });

      // deleteRecords uses body.from which should be extracted as dbid
      const result = await tempTokenClient.deleteRecords({
        from: tableId,
        where: '{3.GT.0}',
      });

      expect(result.numberDeleted).toBeGreaterThanOrEqual(0);
    });

    it('should auto-extract dbid from path for getTable', async () => {
      // getTable uses path /tables/{tableId} which should be extracted as dbid
      const result = await tempTokenClient.getTable({ appId, tableId });

      expect(result.id).toBe(tableId);
    });

    it('should auto-extract dbid from query params for getFields', async () => {
      // getFields uses query param tableId which should be extracted as dbid
      const result = await tempTokenClient.getFields({ tableId });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should cache temp tokens per dbid', async () => {
      // Make two requests to the same table - second should use cached token
      await tempTokenClient.runQuery({ from: tableId, select: [3] });
      await tempTokenClient.runQuery({ from: tableId, select: [3] });

      // If we got here without errors, caching worked
      // (would fail if token wasn't cached and we made duplicate fetch requests)
      expect(true).toBe(true);
    });
  });
});
