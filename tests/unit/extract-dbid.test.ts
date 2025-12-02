/**
 * Unit tests for extractDbid function
 *
 * Tests automatic extraction of database ID from request options.
 */

import { describe, it, expect } from 'vitest';
import { extractDbid } from '../../src/client/request.js';

describe('extractDbid', () => {
  describe('explicit dbid', () => {
    it('should return explicit dbid when provided', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/apps',
        dbid: 'bqxyz123',
      });
      expect(result).toBe('bqxyz123');
    });

    it('should prefer explicit dbid over other sources', () => {
      const result = extractDbid({
        method: 'POST',
        path: '/tables/other123/records',
        query: { tableId: 'query456' },
        body: { from: 'body789' },
        dbid: 'explicit000',
      });
      expect(result).toBe('explicit000');
    });
  });

  describe('query params', () => {
    it('should extract tableId from query params', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/fields',
        query: { tableId: 'bqtable123' },
      });
      expect(result).toBe('bqtable123');
    });

    it('should convert numeric tableId to string', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/fields',
        query: { tableId: 12345 as unknown as string },
      });
      expect(result).toBe('12345');
    });
  });

  describe('path params', () => {
    it('should extract tableId from path /tables/{tableId}', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/tables/bqpath456',
      });
      expect(result).toBe('bqpath456');
    });

    it('should extract tableId from nested path /tables/{tableId}/records', () => {
      const result = extractDbid({
        method: 'POST',
        path: '/tables/bqnested789/records',
      });
      expect(result).toBe('bqnested789');
    });

    it('should extract tableId from path with query string', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/tables/bqquery123?foo=bar',
      });
      expect(result).toBe('bqquery123');
    });
  });

  describe('body.from', () => {
    it('should extract from body.from (runQuery)', () => {
      const result = extractDbid({
        method: 'POST',
        path: '/records/query',
        body: { from: 'bqfrom123', select: [3, 6, 7] },
      });
      expect(result).toBe('bqfrom123');
    });

    it('should extract from body.from (deleteRecords)', () => {
      const result = extractDbid({
        method: 'DELETE',
        path: '/records',
        body: { from: 'bqdelete456', where: '{3.GT.0}' },
      });
      expect(result).toBe('bqdelete456');
    });
  });

  describe('body.to', () => {
    it('should extract from body.to (upsert)', () => {
      const result = extractDbid({
        method: 'POST',
        path: '/records',
        body: { to: 'bqto789', data: [] },
      });
      expect(result).toBe('bqto789');
    });

    it('should prefer body.from over body.to', () => {
      const result = extractDbid({
        method: 'POST',
        path: '/records',
        body: { from: 'bqfrom111', to: 'bqto222' },
      });
      expect(result).toBe('bqfrom111');
    });
  });

  describe('appId extraction', () => {
    it('should extract appId from query params', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/apps',
        query: { appId: 'bqapp123' },
      });
      expect(result).toBe('bqapp123');
    });

    it('should extract appId from path /apps/{appId}', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/apps/bqapp456',
      });
      expect(result).toBe('bqapp456');
    });

    it('should extract appId from nested path /apps/{appId}/tables', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/apps/bqapp789/tables',
      });
      expect(result).toBe('bqapp789');
    });

    it('should prefer tableId over appId in query params', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/fields',
        query: { tableId: 'table123', appId: 'app456' },
      });
      expect(result).toBe('table123');
    });
  });

  describe('priority order', () => {
    it('should prefer query params over path', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/tables/path123',
        query: { tableId: 'query456' },
      });
      expect(result).toBe('query456');
    });

    it('should prefer path over body', () => {
      const result = extractDbid({
        method: 'POST',
        path: '/tables/path123',
        body: { from: 'body456' },
      });
      expect(result).toBe('path123');
    });

    it('should prefer tableId path over appId path', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/apps/app123/tables/table456',
      });
      expect(result).toBe('table456');
    });
  });

  describe('no dbid found', () => {
    it('should return undefined when no dbid available', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/apps',
      });
      expect(result).toBeUndefined();
    });

    it('should return undefined for paths without table or app ID', () => {
      const result = extractDbid({
        method: 'GET',
        path: '/users',
      });
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty body', () => {
      const result = extractDbid({
        method: 'POST',
        path: '/records/query',
        body: {},
      });
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-string body.from', () => {
      const result = extractDbid({
        method: 'POST',
        path: '/records/query',
        body: { from: 12345 },
      });
      expect(result).toBeUndefined();
    });
  });
});
