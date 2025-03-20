// tests/vitest/unit/auth/ssoTokenRefresh.test.ts

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient, mockFetch, QB_REALM, QB_APP_ID } from "@tests/setup.ts";

describe("QuickbaseClient Unit - SsoTokenStrategy", () => {
  let client: ReturnType<typeof createClient>;
  const mockSamlToken = "mock_saml_token_base64url";
  const mockSsoToken = "example_token_1NiIsImtpZCI6IjllciJ9w";

  beforeEach(() => {
    mockFetch.mockClear();
    client = createClient(mockFetch, {
      useSso: true,
      samlToken: mockSamlToken,
      realm: QB_REALM,
      debug: true,
    });
  });

  it("initializes without errors", () => {
    expect(client).toBeDefined();
  });

  it("has exchangeSsoToken method", () => {
    expect(typeof client.exchangeSsoToken).toBe("function");
  });

  it("fetches SSO token on first call", async () => {
    const mockResponse = {
      access_token: mockSsoToken,
      issued_token_type: "urn:quickbase:params:oauth:token-type:temp_token",
      token_type: "N_A",
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: QB_APP_ID, name: "Test App" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await client.getApp({ appId: QB_APP_ID });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "QB-Realm-Hostname": `${QB_REALM}.quickbase.com`,
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
          requested_token_type:
            "urn:quickbase:params:oauth:token-type:temp_token",
          subject_token: mockSamlToken,
          subject_token_type: "urn:ietf:params:oauth:token-type:saml2",
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-TEMP-TOKEN ${mockSsoToken}`,
        }),
      })
    );
    expect(result).toEqual({ id: QB_APP_ID, name: "Test App" });
  });

  it("refreshes SSO token on 401 and retries", async () => {
    const newToken = "new_token_abcdef123";
    const appResponse = { id: QB_APP_ID, name: "Test App" };

    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: mockSsoToken,
            issued_token_type:
              "urn:quickbase:params:oauth:token-type:temp_token",
            token_type: "N_A",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: newToken,
            issued_token_type:
              "urn:quickbase:params:oauth:token-type:temp_token",
            token_type: "N_A",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(appResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const result = await client.getApp({ appId: QB_APP_ID });

    expect(result).toEqual(appResponse);
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-TEMP-TOKEN ${mockSsoToken}`,
        }),
      })
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `QB-TEMP-TOKEN ${newToken}`,
        }),
      })
    );
  });

  it("handles API error on token exchange", async () => {
    // Reset client to avoid interference from beforeEach
    client = createClient(mockFetch, {
      useSso: true,
      samlToken: mockSamlToken,
      realm: QB_REALM,
      debug: true,
    });

    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: mockSsoToken,
            issued_token_type:
              "urn:quickbase:params:oauth:token-type:temp_token",
            token_type: "N_A",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid SAML token" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      );

    await expect(
      client.exchangeSsoToken({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        requested_token_type:
          "urn:quickbase:params:oauth:token-type:temp_token",
        subject_token: mockSamlToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:saml2",
      })
    ).rejects.toThrow("API Error: Invalid SAML token (Status: 400)");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.any(Object)
    );
  });

  it("exhausts retries on repeated 401s", async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: mockSsoToken,
            issued_token_type:
              "urn:quickbase:params:oauth:token-type:temp_token",
            token_type: "N_A",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "retry_token_1",
            issued_token_type:
              "urn:quickbase:params:oauth:token-type:temp_token",
            token_type: "N_A",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "retry_token_2",
            issued_token_type:
              "urn:quickbase:params:oauth:token-type:temp_token",
            token_type: "N_A",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "retry_token_3",
            issued_token_type:
              "urn:quickbase:params:oauth:token-type:temp_token",
            token_type: "N_A",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

    await expect(client.getApp({ appId: QB_APP_ID })).rejects.toThrow(
      "API Error: Unauthorized (Status: 401)"
    );

    expect(mockFetch).toHaveBeenCalledTimes(8);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      4,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      5,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      6,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      7,
      "https://api.quickbase.com/v1/auth/oauth/token",
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      8,
      `https://api.quickbase.com/v1/apps/${QB_APP_ID}`,
      expect.any(Object)
    );
  });
});
