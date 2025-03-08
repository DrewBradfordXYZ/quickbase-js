import { describe, it, expect, beforeEach } from "vitest";
import { createClient, mockFetch } from "../../setup.ts";

describe("QuickbaseClient - getTempTokenDBID (Unit)", () => {
  const client = createClient(mockFetch);

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has getTempTokenDBID method", () => {
    expect(typeof client.getTempTokenDBID).toBe("function");
  });

  it("calls getTempTokenDBID successfully", async () => {
    const mockDbid = "mockDbid123";
    const mockToken = "b123xyz_temp_token";

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ temporaryAuthorization: mockToken }),
    } as Response);

    const result = await client.getTempTokenDBID({ dbid: mockDbid });
    expect(result).toEqual({ temporaryAuthorization: mockToken });
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.quickbase.com/v1/auth/temporary/${mockDbid}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: `QB-USER-TOKEN ${process.env.QB_USER_TOKEN}`,
          "QB-Realm-Hostname": `${process.env.QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("handles API error", async () => {
    const mockDbid = "mockDbid123";
    const errorResponse = {
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Unauthorized" }),
    } as Response;

    mockFetch.mockResolvedValue(errorResponse);

    await expect(client.getTempTokenDBID({ dbid: mockDbid })).rejects.toSatisfy(
      (error: Error) => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("API Error: Unauthorized (Status: 401)");
        return true;
      }
    );
  });
});
