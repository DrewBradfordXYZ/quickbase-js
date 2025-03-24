// src/RateThrottleBucket.ts
export interface RateThrottleBucket {
  acquire(): Promise<void>;
  release(): void;
}
