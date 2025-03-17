// src/TokenBucket.ts
export class ThrottleBucket {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // Tokens per second
  private lastRefill: number;

  constructor(rate: number, burst: number) {
    this.tokens = burst; // Start with full burst capacity
    this.maxTokens = burst;
    this.refillRate = rate;
    this.lastRefill = Date.now();
  }

  // Refill tokens based on elapsed time
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Seconds elapsed
    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  // Acquire a token, waiting if necessary
  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitTime = ((1 - this.tokens) / this.refillRate) * 1000; // ms until next token
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    this.refill();
    this.tokens -= 1;
  }
}
