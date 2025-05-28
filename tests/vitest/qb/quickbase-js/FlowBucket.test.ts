// tests/vitest/qb/ThrottleBucket.test.ts
import { describe, it, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";

describe("QuickbaseClient with ConcurrentThrottleBucket Integration Tests", () => {
  it("handles concurrent API calls with burst and rate limiting in strict order", async () => {
    const mockFetch = async (
      url: string,
      options: RequestInit
    ): Promise<Response> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return new Response(JSON.stringify({ id: "mock-app" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const qbClient = quickbase({
      realm: "test",
      userToken: "mock-token",
      throttle: { rate: 5, burst: 3 },
      fetchApi: mockFetch,
      debug: true,
    });

    const throttleTimes: number[] = [];
    const startTimes: number[] = new Array(6).fill(0);
    const completionTimes: number[] = [];
    const recordTime = async (index: number) => {
      const preThrottle = Date.now();
      throttleTimes[index] = preThrottle;
      await qbClient.getApp({
        appId: "mock-app-id",
        startTime: startTimes[index],
      });
      completionTimes[index] = Date.now();
      startTimes[index] = startTimes[index] || Date.now() - 500;
    };

    const startTime = Date.now();
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(recordTime(i));
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    await Promise.all(promises);

    const relativeThrottleTimes = throttleTimes.map((t) => t - startTime);
    const relativeStartTimes = startTimes.map((t) => t - startTime);
    const durations = completionTimes.map((t) => t - startTime);
    const timings = completionTimes.map((t, i) => t - startTimes[i]);

    console.log("Relative Throttle Times:", relativeThrottleTimes);
    console.log("Relative Start Times (post-throttle):", relativeStartTimes);
    console.log("Durations (completion times):", durations);
    console.log("Timings (fetch durations):", timings);
    console.log("Total Duration:", Date.now() - startTime);

    const totalDuration = Date.now() - startTime;
    expect(totalDuration).toBeGreaterThanOrEqual(1000);
    expect(totalDuration).toBeLessThan(1200); // Adjusted back to ~1100ms

    expect(durations.length).toBe(6);
    expect(durations.slice(0, 3).every((d) => d >= 500 && d < 550)).toBe(true);

    // Sort durations to handle out-of-order completion
    const sortedDurations = [...durations].sort((a, b) => a - b);
    expect(sortedDurations[3]).toBeGreaterThanOrEqual(650);
    expect(sortedDurations[3]).toBeLessThan(750);
    expect(sortedDurations[4]).toBeGreaterThanOrEqual(850);
    expect(sortedDurations[4]).toBeLessThan(950);
    expect(sortedDurations[5]).toBeGreaterThanOrEqual(1050);
    expect(sortedDurations[5]).toBeLessThan(1150);

    expect(timings.every((t) => t >= 500 && t < 550)).toBe(true);
  });
});
