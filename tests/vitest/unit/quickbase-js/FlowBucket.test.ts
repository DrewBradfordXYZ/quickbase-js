// test/vitest/unit/ThrottleBucket.test.ts
import { describe, it, expect, vi } from "vitest";
import { FlowThrottleBucket } from "@/rate-limiting/FlowThrottleBucket"; // Should work with your alias

describe("ConcurrentThrottleBucket Unit Tests", () => {
  it("allows burst capacity immediately", async () => {
    const bucket = new FlowThrottleBucket(5, 3); // rate: 5, burst: 3
    const startTime = Date.now();

    await Promise.all([
      bucket.acquire().then(() => bucket.release()),
      bucket.acquire().then(() => bucket.release()),
      bucket.acquire().then(() => bucket.release()),
    ]);

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(50); // All 3 should be instant (within 50ms)
  });

  it("delays calls beyond burst at correct rate", async () => {
    const bucket = new FlowThrottleBucket(5, 3); // rate: 5 tokens/sec, burst: 3
    const timings: number[] = [];
    const recordTime = async () => {
      await bucket.acquire();
      timings.push(Date.now());
      bucket.release(); // Release slot
    };

    const startTime = Date.now();
    await Promise.all([
      recordTime(),
      recordTime(),
      recordTime(),
      recordTime(), // 4th call should delay
    ]);

    const durations = timings.map((t) => t - startTime);
    expect(durations.length).toBe(4);
    expect(durations[0]).toBeLessThan(50); // 1st call instant
    expect(durations[1]).toBeLessThan(50); // 2nd call instant
    expect(durations[2]).toBeLessThan(50); // 3rd call instant
    expect(durations[3]).toBeGreaterThanOrEqual(180); // 4th call delayed ~200ms
    expect(durations[3]).toBeLessThan(250); // Shouldn’t exceed 250ms
  });

  it("maintains rate over sustained calls", async () => {
    const bucket = new FlowThrottleBucket(2, 2); // rate: 2 tokens/sec, burst: 2
    const timings: number[] = [];
    const recordTime = async () => {
      await bucket.acquire();
      timings.push(Date.now());
      bucket.release(); // Release slot
    };

    const startTime = Date.now();
    await Promise.all([
      recordTime(),
      recordTime(),
      recordTime(),
      recordTime(),
      recordTime(), // 5 calls total
    ]);

    const durations = timings.map((t) => t - startTime);
    expect(durations.length).toBe(5);
    expect(durations[0]).toBeLessThan(50); // 1st instant
    expect(durations[1]).toBeLessThan(50); // 2nd instant
    expect(durations[2]).toBeGreaterThanOrEqual(450); // 3rd delayed ~500ms (1/2 sec)
    expect(durations[2]).toBeLessThan(550);
    expect(durations[3]).toBeGreaterThanOrEqual(950); // 4th delayed ~1000ms
    expect(durations[3]).toBeLessThan(1050);
    expect(durations[4]).toBeGreaterThanOrEqual(1450); // 5th delayed ~1500ms
    expect(durations[4]).toBeLessThan(1550);
  });

  it("handles high concurrency without exceeding burst", async () => {
    const bucket = new FlowThrottleBucket(5, 3); // rate: 5, burst: 3
    const timings: number[] = [];
    const recordTime = async () => {
      await bucket.acquire();
      timings.push(Date.now());
      bucket.release(); // Release slot
    };

    const startTime = Date.now();
    await Promise.all(
      Array(10)
        .fill(null)
        .map(() => recordTime())
    ); // 10 concurrent calls

    const durations = timings.map((t) => t - startTime);
    expect(durations.length).toBe(10);
    expect(durations.slice(0, 3).every((d) => d < 50)).toBe(true); // First 3 instant
    for (let i = 3; i < 10; i++) {
      const expectedDelay = (i - 2) * 200; // After burst, 200ms per token
      expect(durations[i]).toBeGreaterThanOrEqual(expectedDelay - 50);
      expect(durations[i]).toBeLessThan(expectedDelay + 50);
    }
  });
});
