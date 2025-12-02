/**
 * Integration tests for error handling
 *
 * Tests that the SDK properly handles and reports API errors.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { skipIfNoCredentials, createTestClient, TEST_CONTEXT_PATH, TestContext } from './setup.js';
import { NotFoundError, ValidationError, QuickbaseError } from '../../src/core/errors.js';

describe.skipIf(skipIfNoCredentials())('Error Handling Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let appId: string;
  let tableId: string;
  let textFieldId: number;

  beforeAll(() => {
    if (!existsSync(TEST_CONTEXT_PATH)) {
      throw new Error('Test context not found - globalSetup may have failed');
    }
    const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    client = createTestClient();
    appId = ctx.appId;
    tableId = ctx.tableId;
    textFieldId = ctx.textFieldId;
  });

  describe('Not Found errors (404)', () => {
    it('should throw NotFoundError for non-existent table', async () => {
      await expect(
        client.getTable({ appId, tableId: 'bzzzzzzzzz' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for non-existent field', async () => {
      await expect(
        client.getField({ tableId, fieldId: 99999 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Validation errors (400)', () => {
    it('should throw ValidationError for invalid app ID format', async () => {
      await expect(
        client.getApp({ appId: 'invalid_app_id' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw error for invalid query syntax', async () => {
      await expect(
        client.runQuery({
          from: tableId,
          select: [3],
          where: 'this is not valid query syntax',
        })
      ).rejects.toThrow(QuickbaseError);
    });

    it('should throw error for invalid field ID in select', async () => {
      await expect(
        client.runQuery({
          from: tableId,
          select: [99999], // Non-existent field
        })
      ).rejects.toThrow(QuickbaseError);
    });
  });

  describe('Upsert with invalid data', () => {
    it('should return lineErrors for invalid field values', async () => {
      // Upsert doesn't throw for line errors - it returns them in metadata
      const result = await client.upsert({
        to: tableId,
        data: [
          { [textFieldId]: { value: 'Valid' }, '7': { value: 'not a number' } },
        ],
      });

      // The record wasn't created
      expect(result.data).toHaveLength(0);
      // But lineErrors should be populated
      expect(result.metadata?.lineErrors).toBeDefined();
      expect(Object.keys(result.metadata!.lineErrors!).length).toBeGreaterThan(0);
    });
  });

  describe('Error properties', () => {
    it('should include rayId in error', async () => {
      try {
        await client.getTable({ appId, tableId: 'bzzzzzzzzz' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(QuickbaseError);
        const qbError = error as QuickbaseError;
        expect(qbError.rayId).toBeDefined();
        expect(typeof qbError.rayId).toBe('string');
      }
    });

    it('should include statusCode in error', async () => {
      try {
        await client.getTable({ appId, tableId: 'bzzzzzzzzz' });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(QuickbaseError);
        const qbError = error as QuickbaseError;
        expect(qbError.statusCode).toBe(404);
      }
    });
  });

  describe('Empty results (not errors)', () => {
    it('should return empty array for query with no matches', async () => {
      const result = await client.runQuery({
        from: tableId,
        select: [3],
        where: `{${textFieldId}.EX."this_value_definitely_does_not_exist_xyz123"}`,
      });

      expect(result.data).toHaveLength(0);
      expect(result.metadata?.numRecords).toBe(0);
    });

    it('should handle deleteRecords with no matching records gracefully', async () => {
      const result = await client.deleteRecords({
        from: tableId,
        where: '{3.EX.999999999}',
      });

      expect(result.numberDeleted).toBe(0);
    });
  });
});
