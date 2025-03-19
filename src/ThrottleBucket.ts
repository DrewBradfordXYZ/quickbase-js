// src/ThrottleBucket.ts
export class ThrottleBucket {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // Tokens per second
  private lastRefill: number;
  private pending: Promise<void> = Promise.resolve(); // Queue for sequential execution

  constructor(rate: number, burst: number) {
    this.tokens = burst;
    this.maxTokens = burst;
    this.refillRate = rate;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Seconds elapsed
    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    // Chain the new acquisition onto the pending queue
    const previous = this.pending;
    this.pending = (async () => {
      await previous; // Wait for prior calls to complete
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitTime = ((1 - this.tokens) / this.refillRate) * 1000; // ms until next token
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.refill();
      this.tokens -= 1;
    })();
    await this.pending;
  }
}
