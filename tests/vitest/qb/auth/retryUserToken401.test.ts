import { describe, it, vi, expect, beforeEach } from "vitest";
import { quickbase, QuickbaseClient } from "../../../../src/quickbaseClient";
import { ResponseError } from "../../../../src/generated/runtime";

describe("QuickbaseClient Integration - User Token Retry on 401", () => {
  let client: QuickbaseClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    const config = {
      realm: process.env.QB_REALM || "builderprogram-dbradford6815",
      userToken: "mock-user-token",
      debug: true,
      fetchApi: mockFetch,
    };
    console.log("[quickbaseTest] Config:", config);
    client = quickbase(config);
  });

  it("retries on transient 401 with user token and succeeds", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    mockFetch
      .mockImplementationOnce(() => {
        const response = new Response(null, {
          status: 401,
          statusText: "Unauthorized",
        });
        console.log("[mockFetch] Throwing 401 ResponseError");
        return Promise.reject(new ResponseError(response));
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 1, label: "Mock Field", fieldType: "text" }],
      });

    const fields = await client.getFields({ tableId: "mock-table-id" });

    expect(fields).toBeInstanceOf(Array);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields[0]).toHaveProperty("id");
    expect(fields[0]).toHaveProperty("label");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Authorization error for getFields (user token), retrying with same token:",
      "" // Matches empty ResponseError message from mock
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      "Retrying getFields with user token"
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });
});
