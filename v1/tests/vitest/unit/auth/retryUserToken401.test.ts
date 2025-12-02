import { describe, it, expect, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - User Token Retry on 401", () => {
  it("retries with the same user token on 401 and succeeds", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1, label: "Field1" }]), {
          status: 200,
        })
      );

    const consoleSpy = vi.spyOn(console, "log");
    const client = createClient(mockFetch, {
      realm: QB_REALM,
      userToken: "b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
      useTempTokens: false,
      debug: true,
    });

    const result = await client.getFields({ tableId: QB_TABLE_ID_1 });

    expect(result).toEqual([{ id: 1, label: "Field1" }]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization:
            "QB-USER-TOKEN b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
      })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Retrying getFields with existing user token: b9f3pk_q4j..."
    );
    consoleSpy.mockRestore();
  });
});
