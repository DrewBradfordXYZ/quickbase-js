/**
 * Client-side throttling (optional)
 *
 * Implements a sliding window rate limiter that matches QuickBase's
 * "100 requests per 10 seconds per user token" limit.
 *
 * This is OPTIONAL - QuickBase handles rate limiting server-side.
 * Enable this if you want to avoid hitting 429s proactively.
 */

export class SlidingWindowThrottle {
  private readonly requestsPer10Seconds: number;
  private readonly timestamps: number[] = [];

  constructor(requestsPer10Seconds: number = 100) {
    this.requestsPer10Seconds = requestsPer10Seconds;
  }

  /**
   * Wait until a request slot is available
   */
  async acquire(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 10000; // 10 second window

    // Remove timestamps outside the window
    while (this.timestamps.length > 0 && this.timestamps[0]! < windowStart) {
      this.timestamps.shift();
    }

    // If we're at the limit, wait until the oldest request exits the window
    if (this.timestamps.length >= this.requestsPer10Seconds) {
      const oldestTimestamp = this.timestamps[0]!;
      const waitTime = oldestTimestamp + 10000 - now;

      if (waitTime > 0) {
        await this.sleep(waitTime);
        // Recurse to recheck after waiting
        return this.acquire();
      }
    }

    // Record this request
    this.timestamps.push(Date.now());
  }

  /**
   * Get the number of requests made in the current window
   */
  getWindowCount(): number {
    const windowStart = Date.now() - 10000;
    return this.timestamps.filter((t) => t >= windowStart).length;
  }

  /**
   * Get remaining requests available in the current window
   */
  getRemaining(): number {
    return Math.max(0, this.requestsPer10Seconds - this.getWindowCount());
  }

  /**
   * Reset the throttle state
   */
  reset(): void {
    this.timestamps.length = 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * No-op throttle for when proactive throttling is disabled
 */
export class NoOpThrottle {
  async acquire(): Promise<void> {
    // No-op
  }

  getWindowCount(): number {
    return 0;
  }

  getRemaining(): number {
    return Infinity;
  }

  reset(): void {
    // No-op
  }
}

export type Throttle = SlidingWindowThrottle | NoOpThrottle;

export function createThrottle(config: {
  enabled: boolean;
  requestsPer10Seconds: number;
}): Throttle {
  if (config.enabled) {
    return new SlidingWindowThrottle(config.requestsPer10Seconds);
  }
  return new NoOpThrottle();
}
