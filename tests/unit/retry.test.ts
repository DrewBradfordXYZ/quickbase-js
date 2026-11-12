/**
 * Unit tests for retry logic
 *
 * Tests exponential backoff calculation and retry behavior.
 */

import { describe, it, expect } from 'vitest';
import { calculateBackoffDelay } from '../../src/client/retry.js';

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
});
