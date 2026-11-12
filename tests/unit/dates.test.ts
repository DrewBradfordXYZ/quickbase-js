/**
 * Date and Date/Time field values
 *
 * A Date field's day must survive every time zone, in a browser or on a
 * server, and the trip between them. The old conversion made "2024-01-15" a
 * Date at UTC midnight, which is Jan 14 anywhere west of UTC.
 *
 * These tests run in a forked process (vitest.config.ts) so that changing
 * process.env.TZ takes effect.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { QuickbaseDate, QuickbaseDateTime, convertRecordDates, assertNoPlainDate } from '../../src/core/dates.js';

const originalTZ = process.env.TZ;
afterAll(() => {
  process.env.TZ = originalTZ;
});

// From the far west (UTC-11) to the far east (UTC+14)
const ZONES = ['Pacific/Pago_Pago', 'America/Los_Angeles', 'America/New_York', 'UTC', 'Europe/Berlin', 'Asia/Tokyo', 'Pacific/Kiritimati'];

function inZone(zone: string): void {
  process.env.TZ = zone;
  // Guard: a TZ change that didn't take would make every zone test the same zone
  const offset = new Date(2024, 0, 15).getTimezoneOffset();
  const expected = { UTC: 0, 'Asia/Tokyo': -540, 'America/New_York': 300 }[zone as 'UTC'];
  if (expected !== undefined) expect(offset, `TZ=${zone} did not take effect`).toBe(expected);
}

describe('QuickbaseDate', () => {
  it.each(ZONES)('keeps the stored day in %s', (zone) => {
    inZone(zone);
    const d = QuickbaseDate.fromValue('2024-01-15');

    expect(d).toBeInstanceOf(Date);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2024, 0, 15]);
    expect(d.toLocaleDateString('en-US')).toBe('1/15/2024');
    expect(d.toISODate()).toBe('2024-01-15');
    expect(JSON.stringify({ d })).toBe('{"d":"2024-01-15"}');
  });

  it('keeps the day from a server in one zone to a browser in another', () => {
    inZone('UTC');
    const json = JSON.stringify({ due: QuickbaseDate.fromValue('2024-01-15') });

    inZone('America/Los_Angeles');
    const { due } = JSON.parse(json) as { due: string };
    expect(due).toBe('2024-01-15');
    expect(QuickbaseDate.fromValue(due).getDate()).toBe(15);
  });

  it.each(ZONES)('from() takes the local day of a Date in %s', (zone) => {
    inZone(zone);
    expect(QuickbaseDate.from(new Date(2024, 0, 15, 23, 59)).toISODate()).toBe('2024-01-15');
    expect(QuickbaseDate.from(new Date(2024, 0, 15, 0, 0)).toISODate()).toBe('2024-01-15');
  });

  it('takes months 1-12 and keeps years before 100', () => {
    expect(new QuickbaseDate(2024, 12, 31).toISODate()).toBe('2024-12-31');
    expect(new QuickbaseDate(50, 6, 1).toISODate()).toBe('0050-06-01');
  });

  // A server in UTC formatting for a user in New York showed Jan 14: local
  // midnight, formatted in an earlier zone, is the evening before
  it.each(ZONES)('formats the day whatever timeZone it is given, in %s', (zone) => {
    inZone(zone);
    const d = QuickbaseDate.fromValue('2024-01-15');
    for (const timeZone of ['America/New_York', 'Asia/Tokyo', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
      expect(d.toLocaleDateString('en-US', { timeZone })).toBe('1/15/2024');
      expect(d.toLocaleString('en-US', { timeZone })).toBe('1/15/2024, 12:00:00 AM');
    }
    expect(new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).format(d.toUTCDay())).toBe('1/15/2024');
  });

  it('is the day in a template string, such as a query filter', () => {
    const d = QuickbaseDate.fromValue('2024-01-15');
    expect(`{7.AF.'${d}'}`).toBe("{7.AF.'2024-01-15'}");
    expect(String(d)).toBe('2024-01-15');
  });

  it('refuses a day that does not exist instead of rolling it over', () => {
    expect(() => QuickbaseDate.fromValue('2024-02-30')).toThrow(RangeError);
    expect(() => new QuickbaseDate(2024, 13, 1)).toThrow(RangeError);
    expect(new QuickbaseDate(2024, 2, 29).toISODate()).toBe('2024-02-29');
  });

  it('has no own keys, so it compares and spreads like a Date', () => {
    expect(Object.keys(QuickbaseDate.fromValue('2024-01-15'))).toEqual([]);
    expect(Object.keys(QuickbaseDateTime.current())).toEqual([]);
    expect(QuickbaseDate.fromValue('2024-01-15').kind).toBe('date');
  });

  // Chile skips midnight when daylight saving starts: 2024-09-08 begins at 01:00
  it('keeps the day when local midnight does not exist', () => {
    inZone('America/Santiago');
    const d = QuickbaseDate.fromValue('2024-09-08');
    expect(d.toISODate()).toBe('2024-09-08');
    expect(d.getDate()).toBe(8);
  });

  it('comes back from structuredClone as a plain Date, which from() restores', () => {
    const copy = structuredClone(QuickbaseDate.fromValue('2024-01-15'));
    expect(copy).not.toBeInstanceOf(QuickbaseDate);
    expect(QuickbaseDate.from(copy).toISODate()).toBe('2024-01-15');
  });

  it('rejects anything but YYYY-MM-DD', () => {
    for (const bad of ['2024-01-15T00:00:00Z', '01-15-2024', '2024-1-5', '']) {
      expect(() => QuickbaseDate.fromValue(bad)).toThrow(RangeError);
    }
  });
});

describe('QuickbaseDateTime', () => {
  it.each(ZONES)('is the same moment in %s', (zone) => {
    inZone(zone);
    const t = QuickbaseDateTime.fromValue('2024-01-15T15:30:00Z');

    expect(t.getTime()).toBe(Date.UTC(2024, 0, 15, 15, 30));
    expect(JSON.stringify({ t })).toBe('{"t":"2024-01-15T15:30:00.000Z"}');
  });

  it('rejects a bare date and non-dates', () => {
    expect(() => QuickbaseDateTime.fromValue('2024-01-15')).toThrow(RangeError);
    expect(() => QuickbaseDateTime.fromValue('soon')).toThrow(RangeError);
  });

  it('from() and current() are moments', () => {
    const d = new Date(Date.UTC(2024, 0, 15, 15, 30));
    expect(QuickbaseDateTime.from(d).getTime()).toBe(d.getTime());
    expect(Math.abs(QuickbaseDateTime.current().getTime() - Date.now())).toBeLessThan(1000);
  });
});

describe('convertRecordDates', () => {
  const response = {
    fields: [
      { id: 3, label: 'Record ID#', type: 'recordid' },
      { id: 7, label: 'Due', type: 'date' },
      { id: 8, label: 'Closed', type: 'timestamp' },
      { id: 9, label: 'Code', type: 'text' },
      { id: 10, label: 'Start', type: 'timeofday' },
    ],
    data: [
      { 3: { value: 1 }, 7: { value: '2024-01-15' }, 8: { value: '2024-01-15T15:30:00Z' }, 9: { value: '2024-01-15' }, 10: { value: '15:30:00' } },
      { 3: { value: 2 }, 7: { value: '' }, 8: { value: '' }, 9: { value: '' }, 10: { value: '' } },
    ],
    metadata: { totalRecords: 2 },
  };

  it('converts by field type and leaves everything else', () => {
    const result = convertRecordDates(response);
    const [first, blank] = result.data as Array<Record<string, { value: unknown }>>;

    expect(first[7].value).toBeInstanceOf(QuickbaseDate);
    expect((first[7].value as QuickbaseDate).toISODate()).toBe('2024-01-15');
    expect(first[8].value).toBeInstanceOf(QuickbaseDateTime);
    expect(first[9].value).toBe('2024-01-15'); // text that looks like a date
    expect(first[10].value).toBe('15:30:00');
    expect(blank[7].value).toBe('');
    expect(blank[8].value).toBe('');
    expect(result.metadata).toEqual(response.metadata);
  });

  it('does not change its input', () => {
    convertRecordDates(response);
    expect(response.data[0][7].value).toBe('2024-01-15');
  });

  it('leaves responses without field types (upserts) alone', () => {
    const upsert = { data: [{ 7: { value: '2024-01-15' } }], metadata: {} };
    expect(convertRecordDates(upsert)).toBe(upsert);
  });

  it('round-trips: a converted record serializes as QuickBase sends it', () => {
    const result = convertRecordDates(response);
    const sent = JSON.parse(JSON.stringify(result.data[0]));
    expect(sent[7].value).toBe('2024-01-15');
    expect(sent[8].value).toBe('2024-01-15T15:30:00.000Z');
  });
});

describe('assertNoPlainDate', () => {
  it('refuses a plain Date and names the field and both fixes', () => {
    expect(() => assertNoPlainDate(new Date(), '7', 0)).toThrow(/Field "7" in record 1 is a plain Date.*QuickbaseDate\.from.*QuickbaseDateTime\.from/);
  });

  it('allows the date classes and everything else', () => {
    for (const ok of [QuickbaseDate.today(), QuickbaseDateTime.current(), '2024-01-15', 5, null, undefined]) {
      expect(() => assertNoPlainDate(ok, '7', 0)).not.toThrow();
    }
  });
});
