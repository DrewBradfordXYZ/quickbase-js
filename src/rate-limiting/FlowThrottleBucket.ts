// src/FlowThrottleBucket.ts
import { Semaphore } from "../utils/Semaphore";
import { RateThrottleBucket } from "./RateThrottleBucket";

export class FlowThrottleBucket implements RateThrottleBucket {
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
