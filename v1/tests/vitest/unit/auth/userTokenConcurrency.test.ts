// tests/vitest/unit/auth/userTokenConcurrency.test.ts
import { describe, it, expect, vi } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";
import { QB_APP_ID, QB_REALM, QB_USER_TOKEN, mockFetch } from "@tests/setup.ts";

describe("QuickbaseClient Unit - UserTokenStrategy Concurrency", () => {
  it("handles concurrent getApp requests with static user token", async () => {
    mockFetch.mockClear();
    const client = quickbase({
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
      fetchApi: mockFetch,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: QB_APP_ID,
          name: "test-app",
          created: "2025-02-13T18:22:33Z",
          updated: "2025-03-22T04:00:18Z",
        }),
    });

    const concurrentRequests = [
      client.getApp({ appId: QB_APP_ID }),
      client.getApp({ appId: QB_APP_ID }),
      client.getApp({ appId: QB_APP_ID }),
    ];

    const results = await Promise.all(concurrentRequests);

    expect(results).toHaveLength(3);
    results.forEach((result) =>
      expect(result).toEqual({
        id: QB_APP_ID,
        name: "test-app",
        created: expect.any(Date),
        updated: expect.any(Date),
      })
    );

    const appCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes(`/apps/${QB_APP_ID}`)
    );
    expect(appCalls).toHaveLength(3);
    appCalls.forEach((call) =>
      expect(call[1].headers).toMatchObject({
        Authorization: `QB-USER-TOKEN ${QB_USER_TOKEN}`,
      })
    );

    // No token fetches occur with UserTokenStrategy
    const tokenFetchCalls = mockFetch.mock.calls.filter((call) =>
      call[0].includes("/auth")
    );
    expect(tokenFetchCalls).toHaveLength(0);
  });
});
