/**
 * Integration tests for date handling
 *
 * Tests date conversion, timezones, and edge cases with real API data.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { createClient } from '../../src/index.js';
import { skipIfNoCredentials, createTestClient, TEST_CONTEXT_PATH, TestContext, QB_REALM, QB_USER_TOKEN } from './setup.js';

describe.skipIf(skipIfNoCredentials())('Date Handling Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let tableId: string;
  let textFieldId: number;
  let dateFieldId: number;

  beforeAll(() => {
    if (!existsSync(TEST_CONTEXT_PATH)) {
      throw new Error('Test context not found - globalSetup may have failed');
    }
    const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    client = createTestClient();
    tableId = ctx.tableId;
    textFieldId = ctx.textFieldId;
    dateFieldId = ctx.dateFieldId;
  });

  beforeEach(async () => {
    try {
      await client.deleteRecords({ from: tableId, where: '{3.GT.0}' });
    } catch {
      // Ignore
    }
  });

  describe('Date conversion enabled (default)', () => {
    it('should convert date strings to Date objects', async () => {
      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'DateTest' }, [dateFieldId]: { value: '2024-06-15' } }],
      });

      const result = await client.runQuery({
        from: tableId,
        select: [3, dateFieldId],
      });

      const dateValue = result.data![0][dateFieldId].value;
      expect(dateValue).toBeInstanceOf(Date);
    });

    it('should convert created/modified timestamps to Date objects', async () => {
      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'TimestampTest' } }],
      });

      const result = await client.runQuery({
        from: tableId,
        select: [1, 2, 3], // Date Created, Date Modified, Record ID#
      });

      // Field 1 = Date Created, Field 2 = Date Modified
      const createdValue = result.data![0][1].value;
      const modifiedValue = result.data![0][2].value;

      expect(createdValue).toBeInstanceOf(Date);
      expect(modifiedValue).toBeInstanceOf(Date);
    });

    it('should handle various date formats from API', async () => {
      // Insert a record and query back metadata dates
      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'FormatTest' } }],
      });

      // Query table metadata which has dates
      const table = await client.getTable({ appId: (await readContext()).appId, tableId });

      // created/updated should be Date objects
      expect(table.created).toBeInstanceOf(Date);
      expect(table.updated).toBeInstanceOf(Date);
    });
  });

  describe('Date conversion disabled', () => {
    it('should keep date strings when convertDates is false', async () => {
      const noConvertClient = createClient({
        realm: QB_REALM!,
        auth: { type: 'user-token', userToken: QB_USER_TOKEN! },
        convertDates: false,
      });

      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'NoConvertTest' }, [dateFieldId]: { value: '2024-06-15' } }],
      });

      const result = await noConvertClient.runQuery({
        from: tableId,
        select: [3, dateFieldId],
      });

      const dateValue = result.data![0][dateFieldId].value;
      // Should be string, not Date
      expect(typeof dateValue).toBe('string');
      expect(dateValue).toContain('2024-06-15');
    });
  });

  describe('Date edge cases', () => {
    it('should handle null/empty date values', async () => {
      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'NullDate' } }], // No date value
      });

      const result = await client.runQuery({
        from: tableId,
        select: [3, textFieldId, dateFieldId],
      });

      const dateValue = result.data![0][dateFieldId].value;
      // Empty dates come back as empty string or null
      expect([null, '', undefined]).toContain(dateValue);
    });

    it('should handle dates at year boundaries', async () => {
      const testDates = [
        { name: 'NewYear', date: '2024-01-01' },
        { name: 'YearEnd', date: '2024-12-31' },
        { name: 'LeapDay', date: '2024-02-29' },
      ];

      await client.upsert({
        to: tableId,
        data: testDates.map((t) => ({
          [textFieldId]: { value: t.name },
          [dateFieldId]: { value: t.date },
        })),
      });

      const result = await client.runQuery({
        from: tableId,
        select: [3, textFieldId, dateFieldId],
        sortBy: [{ fieldId: dateFieldId, order: 'ASC' }],
      });

      expect(result.data).toHaveLength(3);

      // All should be valid Date objects
      result.data!.forEach((record) => {
        expect(record[dateFieldId].value).toBeInstanceOf(Date);
      });

      // Verify order (NewYear < LeapDay < YearEnd) using UTC methods
      const dates = result.data!.map((r) => r[dateFieldId].value as Date);
      expect(dates[0].getUTCMonth()).toBe(0); // January
      expect(dates[1].getUTCMonth()).toBe(1); // February
      expect(dates[2].getUTCMonth()).toBe(11); // December
    });

    it('should preserve date precision through round-trip', async () => {
      const testDate = '2024-07-20';

      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'RoundTrip' }, [dateFieldId]: { value: testDate } }],
      });

      const result = await client.runQuery({
        from: tableId,
        select: [3, dateFieldId],
      });

      const dateValue = result.data![0][dateFieldId].value as Date;
      // Use UTC methods to avoid timezone issues
      expect(dateValue.getUTCFullYear()).toBe(2024);
      expect(dateValue.getUTCMonth()).toBe(6); // July (0-indexed)
      expect(dateValue.getUTCDate()).toBe(20);
    });
  });
});

async function readContext(): Promise<TestContext> {
  return JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
}
