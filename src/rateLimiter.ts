// src/rateLimiter.ts
import { ThrottleBucket } from "./ThrottleBucket";
import { ResponseError } from "./generated/runtime";

export class RateLimiter {
  constructor(
    private throttleBucket: ThrottleBucket | null,
    public maxRetries: number = 3,
    private retryDelay: number = 1000
  ) {}

  async throttle(): Promise<void> {
    if (this.throttleBucket) {
      await this.throttleBucket.acquire();
    }
  }

  async handle429(error: ResponseError, attempt: number): Promise<number> {
    // Remove the throw here; let invokeMethod handle exhaustion
    const retryAfter = error.response.headers.get("Retry-After");
    return retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : this.retryDelay * Math.pow(2, attempt - 1);
  }
}
