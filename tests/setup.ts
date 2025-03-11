// @tests/setup.ts
import { vi } from "vitest";
import { quickbase } from "../src/quickbaseClient.ts";
import type { QuickbaseConfig } from "../src/quickbaseClient.ts";

export const mockFetch = vi.fn();

export const createClient = (
  fetchApi?: any,
  config: Partial<QuickbaseConfig> = {}
) => {
  const client = quickbase({
    realm: process.env.QB_REALM || "test-realm", // Match upsert.test.ts
    userToken: process.env.QB_USER_TOKEN || "test-token", // Match upsert.test.ts
    debug: true,
    fetchApi,
    ...config,
  });
  console.log("[createClient] Config:", config); // Debug config
  console.log("[createClient] Returning:", client); // Debug client
  return client;
};

// Mock env variables for consistency
vi.stubEnv("QB_REALM", "builderprogram-dbradford6815");
vi.stubEnv("QB_USER_TOKEN", "b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3");
vi.stubEnv("QB_APP_ID", "buwai2zpe");
