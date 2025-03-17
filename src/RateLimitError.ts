// src/RateLimitError.ts
export class RateLimitError extends Error {
  public readonly status: number;
  public readonly retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "RateLimitError";
    this.status = status;
    this.retryAfter = retryAfter; // Seconds from Retry-After header, if present
  }
}
