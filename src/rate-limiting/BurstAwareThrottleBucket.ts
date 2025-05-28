// src/BurstAwareThrottleBucket.ts
import { Semaphore } from "../utils/Semaphore";
import { RateThrottleBucket } from "./RateThrottleBucket";

export class BurstAwareThrottleBucket implements RateThrottleBucket {
  maxTokens: number;
  windowSeconds: number;
  requestTimestamps: number[] = [];
  semaphore: Semaphore;

  constructor(options: { maxTokens: number; windowSeconds: number }) {
    this.maxTokens = options.maxTokens;
    this.windowSeconds = options.windowSeconds;
    this.semaphore = new Semaphore(this.maxTokens);
  }

  countRequestsInWindow() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => now - ts < this.windowSeconds * 1000
    );
    return this.requestTimestamps.length;
  }

  availableTokens() {
    const windowCount = this.countRequestsInWindow();
    return Math.max(
      0,
      Math.min(100 - windowCount, this.maxTokens - windowCount)
    );
  }

  async acquire() {
    while (true) {
      const available = this.availableTokens();
      if (available > 0 && this.semaphore.available() > 0) {
        await this.semaphore.acquire();
        this.requestTimestamps.push(Date.now());
        return;
      }
      const now = Date.now();
      const oldestTimestamp = this.requestTimestamps[0];
      let waitTime = 100;
      if (oldestTimestamp) {
        waitTime = Math.max(
          0,
          this.windowSeconds * 1000 - (now - oldestTimestamp)
        );
      }
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  release() {
    this.semaphore.release();
  }
}
