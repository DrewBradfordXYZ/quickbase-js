// src/ThrottleBucket.ts
export class ConcurrentThrottleBucket {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;
  private semaphore: Semaphore;

  constructor(rate: number, burst: number) {
    this.tokens = burst;
    this.maxTokens = burst;
    this.refillRate = rate;
    this.lastRefill = Date.now();
    this.semaphore = new Semaphore(burst);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    await this.semaphore.acquire();
    try {
      this.refill();
      while (this.tokens < 1) {
        const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        this.refill();
      }
      this.tokens -= 1;
    } catch (error) {
      this.semaphore.release();
      throw error;
    }
  }

  release(): void {
    this.semaphore.release();
  }
}

class Semaphore {
  private permits: number;
  private waiting: Array<{ resolve: () => void; reject: (err: any) => void }> =
    [];

  constructor(maxPermits: number) {
    this.permits = maxPermits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits -= 1;
      return;
    }
    return new Promise((resolve, reject) => {
      this.waiting.push({ resolve, reject });
    });
  }

  release(): void {
    this.permits += 1;
    if (this.waiting.length > 0 && this.permits > 0) {
      const { resolve } = this.waiting.shift()!;
      this.permits -= 1;
      resolve();
    }
  }

  available(): number {
    return this.permits;
  }
}
