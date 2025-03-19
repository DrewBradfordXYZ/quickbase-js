// src/rateLimiter.ts
import { ThrottleBucket } from "./ThrottleBucket";

export class RateLimiter {
  constructor(
    private throttleBucket: ThrottleBucket | null,
    private maxRetries: number = 3,
    private retryDelay: number = 1000
  ) {}

  async throttle(): Promise<void> {
    if (this.throttleBucket) {
      await this.throttleBucket.acquire();
    }
  }

  async handle429(error: ResponseError, attempt: number): Promise<number> {
    if (attempt >= this.maxRetries) throw error;
    const retryAfter = error.response.headers.get("Retry-After");
    return retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : this.retryDelay * Math.pow(2, attempt - 1);
  }
}
