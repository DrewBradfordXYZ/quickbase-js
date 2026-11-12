/**
 * Date and Date/Time values through the client: read by field type, written
 * in the one form each field accepts, and a plain Date refused before anything
 * is sent (QuickBase would save the record with the field blank).
 */

import { describe, it, expect } from 'vitest';
import { createClient, QuickbaseDate, QuickbaseDateTime } from '../../src/index.js';

function client(options: { schema?: boolean; convertDates?: boolean } = {}) {
  const sent: unknown[] = [];
  const fetchApi = (async (_url: string | URL, init?: RequestInit) => {
    if (init?.body) sent.push(JSON.parse(String(init.body)));
    return new Response(
      JSON.stringify({
        fields: [
          { id: 3, label: 'Record ID#', type: 'recordid' },
          { id: 7, label: 'Due', type: 'date' },
          { id: 8, label: 'Closed', type: 'timestamp' },
          { id: 9, label: 'Code', type: 'text' },
        ],
        data: [{ 3: { value: 1 }, 7: { value: '2024-01-15' }, 8: { value: '2024-01-15T15:30:00Z' }, 9: { value: '2024-01-15' } }],
        metadata: { totalRecords: 1, numRecords: 1, numFields: 4, skip: 0 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  const qb = createClient({
    realm: 'testcompany',
    auth: { type: 'user-token', userToken: 'token' },
    fetchApi,
    convertDates: options.convertDates,
    schema: options.schema
      ? { tables: { tasks: { id: 'bqtasks', fields: { id: 3, due: 7, closed: 8, code: 9 } } } }
      : undefined,
  });
  return { qb, sent };
}

describe('reading', () => {
  it('converts Date and Date/Time fields by type, not by how the string looks', async () => {
    const { qb } = client();
    const result = await qb.runQuery({ from: 'bqtasks', select: [3, 7, 8, 9] });
    const record = result.data![0];

    expect(record[7].value).toBeInstanceOf(QuickbaseDate);
    expect((record[7].value as QuickbaseDate).toISODate()).toBe('2024-01-15');
    expect(record[8].value).toBeInstanceOf(QuickbaseDateTime);
    expect((record[8].value as QuickbaseDateTime).getTime()).toBe(Date.UTC(2024, 0, 15, 15, 30));
    expect(record[9].value).toBe('2024-01-15');
  });

  it('converts before schema aliases replace field IDs', async () => {
    const { qb } = client({ schema: true });
    const result = await qb.runQuery({ from: 'tasks', select: ['due', 'closed', 'code'] });
    const record = result.data![0] as unknown as Record<string, unknown>;

    expect(record.due).toBeInstanceOf(QuickbaseDate);
    expect(record.closed).toBeInstanceOf(QuickbaseDateTime);
    expect(record.code).toBe('2024-01-15');
  });

  it('keeps the strings with convertDates: false', async () => {
    const { qb } = client({ convertDates: false });
    const result = await qb.runQuery({ from: 'bqtasks', select: [7, 8] });

    expect(result.data![0][7].value).toBe('2024-01-15');
    expect(result.data![0][8].value).toBe('2024-01-15T15:30:00Z');
  });
});

describe('writing', () => {
  it('sends each kind in the form its field accepts', async () => {
    const { qb, sent } = client();
    await qb.upsert({
      to: 'bqtasks',
      data: [{ 7: QuickbaseDate.fromValue('2024-01-15'), 8: QuickbaseDateTime.fromValue('2024-01-15T15:30:00Z') }],
    });

    const body = sent[0] as { data: Array<Record<string, { value: unknown }>> };
    expect(body.data[0][7].value).toBe('2024-01-15');
    expect(body.data[0][8].value).toBe('2024-01-15T15:30:00.000Z');
  });

  it('round-trips a record it read', async () => {
    const { qb, sent } = client();
    const read = await qb.runQuery({ from: 'bqtasks', select: [3, 7, 8] });
    await qb.upsert({ to: 'bqtasks', data: read.data! });

    const body = sent[1] as { data: Array<Record<string, { value: unknown }>> };
    expect(body.data[0][7].value).toBe('2024-01-15');
    expect(body.data[0][8].value).toBe('2024-01-15T15:30:00.000Z');
  });

  it('refuses a plain Date before sending anything', async () => {
    const { qb, sent } = client();
    await expect(
      // @ts-expect-error: the types refuse a plain Date too
      qb.upsert({ to: 'bqtasks', data: [{ 6: 'Task', 7: new Date() }] })
    ).rejects.toThrow(/Field "7" in record 1 is a plain Date/);
    expect(sent).toHaveLength(0);
  });

  it('names the alias a plain Date was given under', async () => {
    const { qb } = client({ schema: true });
    await expect(
      // @ts-expect-error: the types refuse a plain Date too
      qb.upsert({ to: 'tasks', data: [{ code: 'A' }, { due: new Date() }] })
    ).rejects.toThrow(/Field "due" in record 2/);
  });
});
