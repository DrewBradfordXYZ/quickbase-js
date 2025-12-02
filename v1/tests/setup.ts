// @tests/setup.ts
import { vi } from "vitest";
import { quickbase } from "../src/quickbaseClient.ts";
import type { QuickbaseConfig } from "../src/quickbaseClient.ts";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: "./.env" }); // Assumes .env is at project root

export const mockFetch = vi.fn();

export const QB_REALM = process.env.QB_REALM || "test-realm";
export const QB_USER_TOKEN =
  process.env.QB_USER_TOKEN || "user-token-1234567890";
export const QB_APP_ID = process.env.QB_APP_ID || "app-id-1234567890";
export const QB_TABLE_ID_1 =
  process.env.QB_TABLE_ID_1 || "table-id-1-1234567890";
export const QB_TABLE_ID_2 =
  process.env.QB_TABLE_ID_2 || "table-id-2-1234567890";

// Mock env variables for consistency, using .env values if available
vi.stubEnv("QB_REALM", QB_REALM);
vi.stubEnv("QB_USER_TOKEN", QB_USER_TOKEN);
vi.stubEnv("QB_APP_ID", QB_APP_ID);
vi.stubEnv("QB_TABLE_ID_1", QB_TABLE_ID_1);
vi.stubEnv("QB_TABLE_ID_2", QB_TABLE_ID_2);

export const createClient = (
  fetchApi?: any,
  config: Partial<QuickbaseConfig> = {}
) => {
  // Use loaded env vars with fallbacks for safety
  const realm = QB_REALM;
  const userToken = QB_USER_TOKEN;

  const client = quickbase({
    realm,
    userToken,
    debug: true,
    fetchApi,
    throttle: { rate: 10, burst: 10 }, // Throttle at 10 req/s with 10 burst capacity
    ...config, // Allow overrides if provided
  });
  console.log("[createClient] Config:", {
    realm,
    userToken,
    debug: true,
    throttle: { rate: 10, burst: 10 },
    ...config,
  });
  console.log("[createClient] Returning:", client);
  return client;
};
