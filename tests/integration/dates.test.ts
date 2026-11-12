/**
 * Integration tests for date handling
 *
 * Tests date conversion, timezones, and edge cases with real API data.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { createClient, QuickbaseDate, QuickbaseDateTime } from '../../src/index.js';
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
    it('should make Date fields QuickbaseDate, holding the stored day', async () => {
      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'DateTest' }, [dateFieldId]: { value: '2024-06-15' } }],
      });

      const result = await client.runQuery({
        from: tableId,
        select: [3, dateFieldId],
      });

      const dateValue = result.data![0][dateFieldId].value;
      expect(dateValue).toBeInstanceOf(QuickbaseDate);
      // Local methods give the stored day in this machine's time zone
      expect((dateValue as QuickbaseDate).getDate()).toBe(15);
      expect((dateValue as QuickbaseDate).toISODate()).toBe('2024-06-15');
    });

    it('should make Date/Time fields (Date Created, Date Modified) QuickbaseDateTime', async () => {
      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'TimestampTest' } }],
      });

      const result = await client.runQuery({
        from: tableId,
        select: [1, 2, 3], // Date Created, Date Modified, Record ID#
      });

      expect(result.data![0][1].value).toBeInstanceOf(QuickbaseDateTime);
      expect(result.data![0][2].value).toBeInstanceOf(QuickbaseDateTime);
    });

    it('should keep app and table metadata timestamps as strings', async () => {
      const table = await client.getTable({ appId: (await readContext()).appId, tableId });

      expect(typeof table.created).toBe('string');
      expect(Number.isNaN(Date.parse(table.created!))).toBe(false);
    });

    it('should write back a record it read, dates unchanged', async () => {
      await client.upsert({
        to: tableId,
        data: [{ [textFieldId]: { value: 'RoundTrip' }, [dateFieldId]: { value: '2024-07-20' } }],
      });
      const read = await client.runQuery({ from: tableId, select: [3, dateFieldId] });

      const written = await client.upsert({ to: tableId, data: read.data!, fieldsToReturn: [dateFieldId] });
      expect(written.metadata?.lineErrors).toBeUndefined();

      const again = await client.runQuery({ from: tableId, select: [3, dateFieldId] });
      expect((again.data![0][dateFieldId].value as QuickbaseDate).toISODate()).toBe('2024-07-20');
    });

    it('should write QuickbaseDate.from() and today()', async () => {
      await client.upsert({
        to: tableId,
        data: [
          { [textFieldId]: { value: 'From' }, [dateFieldId]: QuickbaseDate.from(new Date(2024, 1, 29, 23, 30)) },
          { [textFieldId]: { value: 'Today' }, [dateFieldId]: QuickbaseDate.today() },
        ],
      });

      const result = await client.runQuery({
        from: tableId,
        select: [textFieldId, dateFieldId],
        sortBy: [{ fieldId: dateFieldId, order: 'ASC' }],
      });

      expect((result.data![0][dateFieldId].value as QuickbaseDate).toISODate()).toBe('2024-02-29');
      expect((result.data![1][dateFieldId].value as QuickbaseDate).toISODate()).toBe(QuickbaseDate.today().toISODate());
    });

    it('should refuse a plain Date before sending', async () => {
      await expect(
        // @ts-expect-error: the types refuse a plain Date too
        client.upsert({ to: tableId, data: [{ [textFieldId]: 'Plain', [dateFieldId]: new Date() }] })
      ).rejects.toThrow(/plain Date/);

      const result = await client.runQuery({ from: tableId, select: [3] });
      expect(result.data).toHaveLength(0);
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

      // Local days, with no time zone arithmetic
      const days = result.data!.map((r) => (r[dateFieldId].value as QuickbaseDate).toISODate());
      expect(days).toEqual(['2024-01-01', '2024-02-29', '2024-12-31']);
    });
  });
});

async function readContext(): Promise<TestContext> {
  return JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
}
