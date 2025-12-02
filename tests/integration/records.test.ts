/**
 * Integration tests for Record operations
 *
 * Tests upsert, runQuery (with pagination), and deleteRecords
 * against a real QuickBase instance.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { skipIfNoCredentials, createTestClient, TEST_CONTEXT_PATH, TestContext } from './setup.js';

describe.skipIf(skipIfNoCredentials())('Records Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let tableId: string;
  let textFieldId: number;
  let numberFieldId: number;

  beforeAll(() => {
    // Load shared context from globalSetup
    if (!existsSync(TEST_CONTEXT_PATH)) {
      throw new Error('Test context not found - globalSetup may have failed');
    }
    const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    client = createTestClient();
    tableId = ctx.tableId;
    textFieldId = ctx.textFieldId;
    numberFieldId = ctx.numberFieldId;
  });

  beforeEach(async () => {
    // Clean up records between tests
    try {
      await client.deleteRecords({
        from: tableId,
        where: '{3.GT.0}', // Delete all (Record ID# > 0)
      });
    } catch {
      // Ignore if no records exist
    }
  });

  it('should upsert records', async () => {
    const result = await client.upsert({
      to: tableId,
      data: [
        { [textFieldId]: { value: 'Alice' }, [numberFieldId]: { value: 100 } },
        { [textFieldId]: { value: 'Bob' }, [numberFieldId]: { value: 200 } },
      ],
      fieldsToReturn: [3, textFieldId, numberFieldId],
    });

    expect(result.metadata?.createdRecordIds).toHaveLength(2);
    expect(result.data).toHaveLength(2);
  });

  it('should query records with filtering and sorting', async () => {
    // Insert test data
    await client.upsert({
      to: tableId,
      data: [
        { [textFieldId]: { value: 'Alice' }, [numberFieldId]: { value: 100 } },
        { [textFieldId]: { value: 'Bob' }, [numberFieldId]: { value: 200 } },
        { [textFieldId]: { value: 'Charlie' }, [numberFieldId]: { value: 50 } },
      ],
    });

    // Query with filter and sort
    const result = await client.runQuery({
      from: tableId,
      select: [3, textFieldId, numberFieldId],
      where: `{${numberFieldId}.GT.75}`, // Alice (100) and Bob (200)
      sortBy: [{ fieldId: numberFieldId, order: 'DESC' }],
    });

    expect(result.data).toHaveLength(2);
    // Bob (200) should be first due to DESC sort
    expect(result.data![0][textFieldId].value).toBe('Bob');
    expect(result.data![0][numberFieldId].value).toBe(200);
    // Alice (100) should be second
    expect(result.data![1][textFieldId].value).toBe('Alice');
  });

  it('should paginate large result sets with .all()', async () => {
    // Insert enough records to trigger pagination (QuickBase default is ~100 per page)
    const recordCount = 150;
    const records = Array.from({ length: recordCount }, (_, i) => ({
      [textFieldId]: { value: `Record ${i}` },
      [numberFieldId]: { value: i },
    }));

    await client.upsert({ to: tableId, data: records });

    // Fetch all with .all() - should auto-paginate
    const allRecords = await client.runQuery({
      from: tableId,
      select: [3],
    }).all();

    expect(allRecords.data!.length).toBeGreaterThanOrEqual(recordCount);
    expect(allRecords.metadata?.totalRecords).toBeGreaterThanOrEqual(recordCount);
  });

  it('should paginate with limit using .paginate()', async () => {
    // Insert test data
    const recordCount = 50;
    const records = Array.from({ length: recordCount }, (_, i) => ({
      [textFieldId]: { value: `Record ${i}` },
      [numberFieldId]: { value: i },
    }));

    await client.upsert({ to: tableId, data: records });

    // Fetch with limit
    const limited = await client.runQuery({
      from: tableId,
      select: [3],
    }).paginate({ limit: 25 });

    expect(limited.data!.length).toBe(25);
  });

  it('should delete records', async () => {
    // Insert test data
    await client.upsert({
      to: tableId,
      data: [
        { [textFieldId]: { value: 'ToDelete1' }, [numberFieldId]: { value: 1 } },
        { [textFieldId]: { value: 'ToDelete2' }, [numberFieldId]: { value: 2 } },
      ],
    });

    // Verify records exist
    const before = await client.runQuery({
      from: tableId,
      select: [3],
    });
    expect(before.data!.length).toBe(2);

    // Delete all records
    await client.deleteRecords({
      from: tableId,
      where: '{3.GT.0}',
    });

    // Verify records deleted
    const after = await client.runQuery({
      from: tableId,
      select: [3],
    });
    expect(after.data).toHaveLength(0);
  });

  it('should update existing records with upsert', async () => {
    // Insert a record
    const insertResult = await client.upsert({
      to: tableId,
      data: [{ [textFieldId]: { value: 'Original' }, [numberFieldId]: { value: 100 } }],
      fieldsToReturn: [3, textFieldId, numberFieldId],
    });

    const recordId = insertResult.metadata?.createdRecordIds?.[0];
    expect(recordId).toBeDefined();

    // Update the record using Record ID# (field 3) as merge field
    const updateResult = await client.upsert({
      to: tableId,
      data: [{ '3': { value: recordId }, [textFieldId]: { value: 'Updated' }, [numberFieldId]: { value: 999 } }],
      mergeFieldId: 3,
      fieldsToReturn: [3, textFieldId, numberFieldId],
    });

    expect(updateResult.metadata?.updatedRecordIds).toContain(recordId);

    // Verify update
    const query = await client.runQuery({
      from: tableId,
      select: [3, textFieldId, numberFieldId],
      where: `{3.EX.${recordId}}`,
    });

    expect(query.data).toHaveLength(1);
    expect(query.data![0][textFieldId].value).toBe('Updated');
    expect(query.data![0][numberFieldId].value).toBe(999);
  });
});
