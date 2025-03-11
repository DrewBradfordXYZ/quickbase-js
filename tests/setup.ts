// @tests/setup.ts
import { vi } from "vitest";
import { quickbase } from "../src/quickbaseClient.ts";
import type { QuickbaseConfig } from "../src/quickbaseClient.ts";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: "./.env" }); // Assumes .env is at project root

export const mockFetch = vi.fn();

export const QB_TABLE_ID_1 = process.env.QB_TABLE_ID_1 || "test-table-id-1";

export const createClient = (
  fetchApi?: any,
  config: Partial<QuickbaseConfig> = {}
) => {
  // Use loaded env vars with fallbacks for safety
  const realm = process.env.QB_REALM || "test-realm";
  const userToken = process.env.QB_USER_TOKEN || "test-token";

  const client = quickbase({
    realm,
    userToken,
    debug: true,
    fetchApi,
    ...config, // Allow overrides if provided
  });
  console.log("[createClient] Config:", {
    realm,
    userToken,
    debug: true,
    ...config,
  });
  console.log("[createClient] Returning:", client);
  return client;
};

// Mock env variables for consistency, using .env values if available
vi.stubEnv("QB_REALM", process.env.QB_REALM || "test-realm");
vi.stubEnv(
  "QB_USER_TOKEN",
  process.env.QB_USER_TOKEN || "user-token-1234567890"
);
vi.stubEnv("QB_APP_ID", process.env.QB_APP_ID || "app-id-1234567890");
vi.stubEnv("QB_TABLE_ID_1", process.env.QB_TABLE_ID_1 || "table-id-1234567890");
