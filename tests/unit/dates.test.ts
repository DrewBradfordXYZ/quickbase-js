/**
 * Date conversion unit tests
 */

import { describe, it, expect } from 'vitest';
import { transformDates, isIsoDateString } from '../../src/core/dates.js';

describe('isIsoDateString', () => {
  it('should match date-only strings', () => {
    expect(isIsoDateString('2024-01-15')).toBe(true);
    expect(isIsoDateString('2024-12-31')).toBe(true);
  });

  it('should match date-time strings', () => {
    expect(isIsoDateString('2024-01-15T10:30:00')).toBe(true);
    expect(isIsoDateString('2024-01-15T10:30:00Z')).toBe(true);
    expect(isIsoDateString('2024-01-15T10:30:00.000Z')).toBe(true);
    expect(isIsoDateString('2024-01-15T10:30:00.123Z')).toBe(true);
  });

  it('should match date-time with timezone offset', () => {
    expect(isIsoDateString('2024-01-15T10:30:00+00:00')).toBe(true);
    expect(isIsoDateString('2024-01-15T10:30:00-05:00')).toBe(true);
    expect(isIsoDateString('2024-01-15T10:30:00+0530')).toBe(true);
  });

  it('should not match non-date strings', () => {
    expect(isIsoDateString('hello world')).toBe(false);
    expect(isIsoDateString('2024')).toBe(false);
    expect(isIsoDateString('2024-01')).toBe(false);
    expect(isIsoDateString('01-15-2024')).toBe(false);
    expect(isIsoDateString('')).toBe(false);
  });
});

describe('transformDates', () => {
  it('should convert ISO date strings to Date objects', () => {
    const input = {
      created: '2024-01-15T10:30:00.000Z',
      updated: '2024-03-20T14:45:00.000Z',
    };

    const result = transformDates(input, true);

    expect(result.created).toBeInstanceOf(Date);
    expect(result.updated).toBeInstanceOf(Date);
    expect((result.created as Date).toISOString()).toBe('2024-01-15T10:30:00.000Z');
    expect((result.updated as Date).toISOString()).toBe('2024-03-20T14:45:00.000Z');
  });

  it('should preserve non-date strings', () => {
    const input = {
      name: 'Test Application',
      id: 'bpqe82s1',
    };

    const result = transformDates(input, true);

    expect(result.name).toBe('Test Application');
    expect(result.id).toBe('bpqe82s1');
  });

  it('should handle nested objects', () => {
    const input = {
      app: {
        name: 'Test App',
        created: '2024-01-15T10:30:00.000Z',
        metadata: {
          updated: '2024-03-20T14:45:00.000Z',
        },
      },
    };

    const result = transformDates(input, true);

    expect(result.app.name).toBe('Test App');
    expect(result.app.created).toBeInstanceOf(Date);
    expect(result.app.metadata.updated).toBeInstanceOf(Date);
  });

  it('should handle arrays', () => {
    const input = {
      items: [
        { id: 1, created: '2024-01-01T00:00:00Z' },
        { id: 2, created: '2024-02-01T00:00:00Z' },
      ],
    };

    const result = transformDates(input, true);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].created).toBeInstanceOf(Date);
    expect(result.items[1].created).toBeInstanceOf(Date);
  });

  it('should skip transformation when disabled', () => {
    const input = {
      created: '2024-01-15T10:30:00.000Z',
      name: 'Test',
    };

    const result = transformDates(input, false);

    expect(result.created).toBe('2024-01-15T10:30:00.000Z');
    expect(typeof result.created).toBe('string');
  });

  it('should handle null and undefined values', () => {
    expect(transformDates(null, true)).toBe(null);
    expect(transformDates(undefined, true)).toBe(undefined);
  });

  it('should preserve existing Date objects', () => {
    const date = new Date('2024-01-15T10:30:00.000Z');
    const input = { created: date };

    const result = transformDates(input, true);

    expect(result.created).toBe(date);
  });

  it('should handle primitive values', () => {
    expect(transformDates('hello', true)).toBe('hello');
    expect(transformDates(123, true)).toBe(123);
    expect(transformDates(true, true)).toBe(true);
  });

  it('should convert date-only strings', () => {
    const input = {
      date: '2024-01-15',
    };

    const result = transformDates(input, true);

    expect(result.date).toBeInstanceOf(Date);
  });
});

describe('transformDates with QuickBase response', () => {
  it('should transform a typical getApp response', () => {
    const response = {
      id: 'bpqe82s1',
      name: 'Test Application',
      description: 'A test application',
      created: '2024-01-15T10:30:00.000Z',
      updated: '2024-03-20T14:45:00.000Z',
      dateFormat: 'MM-DD-YYYY',
      variables: [
        { name: 'AppVersion', value: '1.0.0' },
      ],
    };

    const result = transformDates(response, true);

    expect(result.id).toBe('bpqe82s1');
    expect(result.name).toBe('Test Application');
    expect(result.created).toBeInstanceOf(Date);
    expect(result.updated).toBeInstanceOf(Date);
    expect(result.dateFormat).toBe('MM-DD-YYYY'); // Not a date
    expect(result.variables[0].name).toBe('AppVersion');
  });

  it('should transform a runQuery response with record data', () => {
    const response = {
      data: [
        {
          '3': { value: 1 },
          '6': { value: 'Test Record' },
          '7': { value: '2024-01-15T10:30:00.000Z' },
        },
      ],
      fields: [
        { id: 3, label: 'Record ID#', type: 'recordid' },
        { id: 6, label: 'Name', type: 'text' },
        { id: 7, label: 'Created', type: 'timestamp' },
      ],
      metadata: {
        totalRecords: 1,
        numRecords: 1,
        skip: 0,
      },
    };

    const result = transformDates(response, true);

    // The date value inside the record should be converted
    expect(result.data[0]['7'].value).toBeInstanceOf(Date);
    expect(result.data[0]['6'].value).toBe('Test Record');
  });
});
