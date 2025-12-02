/**
 * Integration tests for different field types
 *
 * Tests date, checkbox, and other field types beyond basic text/numeric.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { skipIfNoCredentials, createTestClient, TEST_CONTEXT_PATH, TestContext } from './setup.js';

describe.skipIf(skipIfNoCredentials())('Field Types Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let tableId: string;
  let textFieldId: number;
  let numberFieldId: number;
  let dateFieldId: number;
  let checkboxFieldId: number;

  beforeAll(() => {
    if (!existsSync(TEST_CONTEXT_PATH)) {
      throw new Error('Test context not found - globalSetup may have failed');
    }
    const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    client = createTestClient();
    tableId = ctx.tableId;
    textFieldId = ctx.textFieldId;
    numberFieldId = ctx.numberFieldId;
    dateFieldId = ctx.dateFieldId;
    checkboxFieldId = ctx.checkboxFieldId;
  });

  beforeEach(async () => {
    try {
      await client.deleteRecords({
        from: tableId,
        where: '{3.GT.0}',
      });
    } catch {
      // Ignore if no records exist
    }
  });

  it('should handle date fields', async () => {
    const testDate = '2024-06-15';

    const result = await client.upsert({
      to: tableId,
      data: [
        {
          [textFieldId]: { value: 'DateTest' },
          [dateFieldId]: { value: testDate },
        },
      ],
      fieldsToReturn: [3, textFieldId, dateFieldId],
    });

    expect(result.metadata?.createdRecordIds).toHaveLength(1);

    // Query back and verify
    const query = await client.runQuery({
      from: tableId,
      select: [3, textFieldId, dateFieldId],
    });

    expect(query.data).toHaveLength(1);
    // Date may come back as ISO string or Date object depending on convertDates setting
    const dateValue = query.data![0][dateFieldId].value;
    expect(dateValue).toBeTruthy();
    // Check that it contains the date we sent
    const dateStr = dateValue instanceof Date ? dateValue.toISOString() : String(dateValue);
    expect(dateStr).toContain('2024-06-15');
  });

  it('should handle checkbox fields', async () => {
    const result = await client.upsert({
      to: tableId,
      data: [
        {
          [textFieldId]: { value: 'CheckedItem' },
          [checkboxFieldId]: { value: true },
        },
        {
          [textFieldId]: { value: 'UncheckedItem' },
          [checkboxFieldId]: { value: false },
        },
      ],
      fieldsToReturn: [3, textFieldId, checkboxFieldId],
    });

    expect(result.metadata?.createdRecordIds).toHaveLength(2);

    // Query back and verify
    const query = await client.runQuery({
      from: tableId,
      select: [3, textFieldId, checkboxFieldId],
      sortBy: [{ fieldId: textFieldId, order: 'ASC' }],
    });

    expect(query.data).toHaveLength(2);
    // CheckedItem should be true
    expect(query.data![0][checkboxFieldId].value).toBe(true);
    // UncheckedItem should be false
    expect(query.data![1][checkboxFieldId].value).toBe(false);
  });

  it('should filter by checkbox value', async () => {
    await client.upsert({
      to: tableId,
      data: [
        { [textFieldId]: { value: 'Active1' }, [checkboxFieldId]: { value: true } },
        { [textFieldId]: { value: 'Active2' }, [checkboxFieldId]: { value: true } },
        { [textFieldId]: { value: 'Inactive' }, [checkboxFieldId]: { value: false } },
      ],
    });

    // Query only checked items
    const activeOnly = await client.runQuery({
      from: tableId,
      select: [3, textFieldId, checkboxFieldId],
      where: `{${checkboxFieldId}.EX.true}`,
    });

    expect(activeOnly.data).toHaveLength(2);
    activeOnly.data!.forEach((record) => {
      expect(record[checkboxFieldId].value).toBe(true);
    });
  });

  it('should filter by date range', async () => {
    await client.upsert({
      to: tableId,
      data: [
        { [textFieldId]: { value: 'Early' }, [dateFieldId]: { value: '2024-01-15' } },
        { [textFieldId]: { value: 'Mid' }, [dateFieldId]: { value: '2024-06-15' } },
        { [textFieldId]: { value: 'Late' }, [dateFieldId]: { value: '2024-12-15' } },
      ],
    });

    // Query dates after June 1st
    const afterJune = await client.runQuery({
      from: tableId,
      select: [3, textFieldId, dateFieldId],
      where: `{${dateFieldId}.AF.2024-06-01}`,
      sortBy: [{ fieldId: dateFieldId, order: 'ASC' }],
    });

    expect(afterJune.data).toHaveLength(2);
    expect(afterJune.data![0][textFieldId].value).toBe('Mid');
    expect(afterJune.data![1][textFieldId].value).toBe('Late');
  });

  it('should handle special characters in text fields', async () => {
    const specialText = "Test with 'quotes', \"double quotes\", & ampersands, <brackets>";

    const result = await client.upsert({
      to: tableId,
      data: [
        { [textFieldId]: { value: specialText }, [numberFieldId]: { value: 1 } },
      ],
      fieldsToReturn: [3, textFieldId],
    });

    expect(result.metadata?.createdRecordIds).toHaveLength(1);

    const query = await client.runQuery({
      from: tableId,
      select: [3, textFieldId],
    });

    expect(query.data![0][textFieldId].value).toBe(specialText);
  });

  it('should handle null/empty values', async () => {
    // Insert record with only required field, leaving optional fields empty
    const result = await client.upsert({
      to: tableId,
      data: [
        { [textFieldId]: { value: 'OnlyName' } },
      ],
      fieldsToReturn: [3, textFieldId, numberFieldId, dateFieldId, checkboxFieldId],
    });

    expect(result.metadata?.createdRecordIds).toHaveLength(1);

    const query = await client.runQuery({
      from: tableId,
      select: [3, textFieldId, numberFieldId, dateFieldId, checkboxFieldId],
    });

    expect(query.data).toHaveLength(1);
    expect(query.data![0][textFieldId].value).toBe('OnlyName');
    // Empty fields return empty string or default values in QuickBase
    // Numeric fields return null, text/date return empty string, checkbox returns false
    expect([null, 0]).toContain(query.data![0][numberFieldId].value);
    expect(['', null]).toContain(query.data![0][dateFieldId].value);
    expect(query.data![0][checkboxFieldId].value).toBe(false); // Checkbox defaults to false
  });
});
