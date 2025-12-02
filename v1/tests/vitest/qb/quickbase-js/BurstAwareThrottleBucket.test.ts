// tests/vitest/qb/BurstAwareThrottleBucket.test.ts
import { describe, it, expect } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";

// Set this to true to run the slow test with 80 burst and 100 calls
const runSlowTests = false;

describe("QuickbaseClient with BurstAwareThrottleBucket Integration Tests", () => {
  // Helper function to reduce duplication
  const runThrottleTest = async (
    burst: number,
    windowSeconds: number,
    callCount: number
  ) => {
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
      throttle: { type: "burst-aware", burst, windowSeconds },
      fetchApi: mockFetch,
      debug: true,
    });

    const throttleTimes: number[] = [];
    const startTimes: number[] = new Array(callCount).fill(0);
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
    for (let i = 0; i < callCount; i++) {
      promises.push(recordTime(i));
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    await Promise.all(promises);

    const relativeThrottleTimes = throttleTimes.map((t) => t - startTime);
    const relativeStartTimes = startTimes.map((t) => t - startTime);
    const durations = completionTimes.map((t) => t - startTime);
    const timings = completionTimes.map((t, i) => t - startTimes[i]);

    console.log("Relative Throttle Times:", relativeThrottleTimes.slice(0, 10));
    console.log("Relative Start Times:", relativeStartTimes.slice(0, 10));
    console.log("Durations:", durations.slice(0, 10));
    console.log("Timings:", timings.slice(0, 10));
    console.log("Total Duration:", Date.now() - startTime);

    return { totalDuration: Date.now() - startTime, durations, timings };
  };

  it("handles concurrent API calls with burst 3 and 0.5s window", async () => {
    const { totalDuration, durations, timings } = await runThrottleTest(
      3,
      0.5,
      6
    );

    expect(totalDuration).toBeGreaterThanOrEqual(1000);
    expect(totalDuration).toBeLessThan(1200);

    expect(durations.length).toBe(6);
    expect(durations.slice(0, 3).every((d) => d >= 500 && d < 550)).toBe(true);

    const sortedDurations = [...durations].sort((a, b) => a - b);
    expect(sortedDurations[3]).toBeGreaterThanOrEqual(1000);
    expect(sortedDurations[3]).toBeLessThan(1100);
    expect(sortedDurations[4]).toBeGreaterThanOrEqual(1000);
    expect(sortedDurations[4]).toBeLessThan(1100);
    expect(sortedDurations[5]).toBeGreaterThanOrEqual(1000);
    expect(sortedDurations[5]).toBeLessThan(1100);

    expect(timings.every((t) => t >= 490 && t < 560)).toBe(true);
  });

  // Optional test for 80 burst - set runSlowTests = true to enable
  if (runSlowTests) {
    it(
      "handles 100 concurrent API calls with burst 80 and 10s window",
      { timeout: 12000 },
      async () => {
        const { totalDuration, durations, timings } = await runThrottleTest(
          80,
          10,
          100
        );

        expect(totalDuration).toBeGreaterThanOrEqual(10500);
        expect(totalDuration).toBeLessThan(11500);

        expect(durations.length).toBe(100);
        expect(durations.slice(0, 80).every((d) => d >= 500 && d < 600)).toBe(
          true
        );

        const sortedDurations = [...durations].sort((a, b) => a - b);
        expect(
          sortedDurations.slice(80).every((d) => d >= 10500 && d < 10600)
        ).toBe(true);

        expect(timings.every((t) => t >= 490 && t < 560)).toBe(true);
      }
    );
  } else {
    it.skip("handles 100 concurrent API calls with burst 80 and 10s window", () => {});
  }
});
