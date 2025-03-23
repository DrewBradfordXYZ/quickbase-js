// src/rateLimiter.ts
import { ConcurrentThrottleBucket } from "./ThrottleBucket"; // Updated import
import { ResponseError } from "./generated/runtime";

export class RateLimiter {
  constructor(
    private throttleBucket: ConcurrentThrottleBucket | null, // Updated type
    public maxRetries: number = 3,
    private retryDelay: number = 1000
  ) {}

  async throttle(): Promise<void> {
    if (this.throttleBucket) {
      await this.throttleBucket.acquire();
    }
  }

  release(): void {
    if (this.throttleBucket) {
      this.throttleBucket.release();
    }
  }

  async handle429(error: ResponseError, attempt: number): Promise<number> {
    const retryAfter = error.response.headers.get("Retry-After");
    return retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : this.retryDelay * Math.pow(2, attempt - 1);
  }
}
