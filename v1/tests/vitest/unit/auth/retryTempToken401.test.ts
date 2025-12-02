// tests/vitest/unit/auth/retryTempToken401.test.ts

import { describe, it, expect, vi } from "vitest";
import {
  createClient,
  mockFetch,
  QB_REALM,
  QB_TABLE_ID_1,
} from "@tests/setup.ts";

describe("QuickbaseClient Unit - Temp Token Retry on 401", () => {
  it("creates a new token on 401 and retries successfully", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ temporaryAuthorization: "initial_token" }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ temporaryAuthorization: "new_token_456" }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1, label: "Field1" }]), {
          status: 200,
        })
      );

    const consoleSpy = vi.spyOn(console, "log");
    const client = createClient(mockFetch, {
      realm: QB_REALM,
      useTempTokens: true,
      debug: true,
    });

    const result = await client.getFields({ tableId: QB_TABLE_ID_1 });

    expect(result).toEqual([{ id: 1, label: "Field1" }]);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN initial_token",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      `https://api.quickbase.com/v1/auth/temporary/${QB_TABLE_ID_1}`,
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/fields?tableId=${QB_TABLE_ID_1}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "QB-TEMP-TOKEN new_token_456",
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
      })
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields (temp token), refreshing token:"
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "[getFields] Retrying with token: new_token_..."
    );
  });
});
