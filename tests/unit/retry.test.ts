/**
 * Unit tests for retry logic
 *
 * Tests exponential backoff calculation and retry behavior.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBackoffDelay,
  getRetryDelay,
  isRetryableStatus,
} from '../../src/client/retry.js';
import { isRetryableError, RateLimitError, ServerError, ValidationError, NotFoundError } from '../../src/core/errors.js';

describe('Retry Logic', () => {
  describe('calculateBackoffDelay', () => {
    const options = {
      maxAttempts: 5,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      multiplier: 2,
    };

    it('should calculate first attempt delay around initialDelayMs', () => {
      const delay = calculateBackoffDelay(1, options);
      // 100ms ± 10% jitter
      expect(delay).toBeGreaterThanOrEqual(90);
      expect(delay).toBeLessThanOrEqual(110);
    });

    it('should double delay for each subsequent attempt', () => {
      // Attempt 2: 100 * 2^1 = 200ms
      const delay2 = calculateBackoffDelay(2, options);
      expect(delay2).toBeGreaterThanOrEqual(180);
      expect(delay2).toBeLessThanOrEqual(220);

      // Attempt 3: 100 * 2^2 = 400ms
      const delay3 = calculateBackoffDelay(3, options);
      expect(delay3).toBeGreaterThanOrEqual(360);
      expect(delay3).toBeLessThanOrEqual(440);

      // Attempt 4: 100 * 2^3 = 800ms
      const delay4 = calculateBackoffDelay(4, options);
      expect(delay4).toBeGreaterThanOrEqual(720);
      expect(delay4).toBeLessThanOrEqual(880);
    });

    it('should cap at maxDelayMs', () => {
      // Attempt 5: 100 * 2^4 = 1600ms, but capped at 1000ms
      const delay = calculateBackoffDelay(5, options);
      expect(delay).toBeLessThanOrEqual(1100); // 1000 + 10% jitter max
    });

    it('should respect different multipliers', () => {
      const tripleOptions = { ...options, multiplier: 3 };
      // Attempt 2: 100 * 3^1 = 300ms
      const delay = calculateBackoffDelay(2, tripleOptions);
      expect(delay).toBeGreaterThanOrEqual(270);
      expect(delay).toBeLessThanOrEqual(330);
    });
  });

  describe('getRetryDelay', () => {
    const options = {
      maxAttempts: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      multiplier: 2,
    };

    it('should use Retry-After header in seconds', () => {
      const response = new Response(null, {
        status: 429,
        headers: { 'Retry-After': '5' },
      });

      const delay = getRetryDelay(response, 1, options);
      expect(delay).toBe(5000); // 5 seconds in ms
    });

    it('should fall back to backoff when no Retry-After', () => {
      const response = new Response(null, { status: 429 });
      const delay = getRetryDelay(response, 1, options);
      // Should use calculated backoff
      expect(delay).toBeGreaterThanOrEqual(90);
      expect(delay).toBeLessThanOrEqual(110);
    });

    it('should handle null response', () => {
      const delay = getRetryDelay(null, 1, options);
      // Should use calculated backoff
      expect(delay).toBeGreaterThanOrEqual(90);
      expect(delay).toBeLessThanOrEqual(110);
    });

    it('should parse Retry-After as date string', () => {
      const futureDate = new Date(Date.now() + 3000);
      const response = new Response(null, {
        status: 429,
        headers: { 'Retry-After': futureDate.toUTCString() },
      });

      const delay = getRetryDelay(response, 1, options);
      // Should be approximately 3 seconds (with generous tolerance for CI/execution time)
      expect(delay).toBeGreaterThan(1500);
      expect(delay).toBeLessThan(3500);
    });
  });

  describe('isRetryableStatus', () => {
    it('should return true for 429', () => {
      expect(isRetryableStatus(429)).toBe(true);
    });

    it('should return true for 5xx errors', () => {
      expect(isRetryableStatus(500)).toBe(true);
      expect(isRetryableStatus(502)).toBe(true);
      expect(isRetryableStatus(503)).toBe(true);
      expect(isRetryableStatus(504)).toBe(true);
      expect(isRetryableStatus(599)).toBe(true);
    });

    it('should return false for 4xx errors (except 429)', () => {
      expect(isRetryableStatus(400)).toBe(false);
      expect(isRetryableStatus(401)).toBe(false);
      expect(isRetryableStatus(403)).toBe(false);
      expect(isRetryableStatus(404)).toBe(false);
      expect(isRetryableStatus(422)).toBe(false);
    });

    it('should return false for success codes', () => {
      expect(isRetryableStatus(200)).toBe(false);
      expect(isRetryableStatus(201)).toBe(false);
      expect(isRetryableStatus(204)).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for RateLimitError', () => {
      const error = new RateLimitError({
        timestamp: new Date(),
        requestUrl: 'https://test.com',
        httpStatus: 429,
        attempt: 1,
      });
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for ServerError', () => {
      const error = new ServerError('Server error', { statusCode: 500 });
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for ValidationError', () => {
      const error = new ValidationError('Bad request');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for NotFoundError', () => {
      const error = new NotFoundError('Not found');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for generic Error', () => {
      const error = new Error('Generic error');
      expect(isRetryableError(error)).toBe(false);
    });
  });
});
