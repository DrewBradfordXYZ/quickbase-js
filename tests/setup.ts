// tests/setup.ts
import { vi } from "vitest";
import { quickbase } from "../src/client/quickbaseClient";
import type { QuickbaseConfig } from "../src/client/quickbaseClient";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const mockFetch = vi.fn();

export const QB_REALM = process.env.QB_REALM || "builderprogram-dbradford6815";
export const QB_USER_TOKEN =
  process.env.QB_USER_TOKEN || "user-token-1234567890";
export const QB_APP_ID = process.env.QB_APP_ID || "app-id-1234567890";
export const QB_TABLE_ID_1 = process.env.QB_TABLE_ID_1 || "bck7x8y9z";
export const QB_TABLE_ID_2 =
  process.env.QB_TABLE_ID_2 || "table-id-2-1234567890";
export const QB_USERNAME =
  process.env.QB_USERNAME || "drewbradfordxyz@gmail.com";
export const QB_PASSWORD = process.env.QB_PASSWORD || "builder-account2";
export const QB_APP_TOKEN =
  process.env.QB_APP_TOKEN || "cum46qtvqifkpc4ard3uz56ksg";

vi.stubEnv("QB_REALM", QB_REALM);
vi.stubEnv("QB_USER_TOKEN", QB_USER_TOKEN);
vi.stubEnv("QB_APP_ID", QB_APP_ID);
vi.stubEnv("QB_TABLE_ID_1", QB_TABLE_ID_1);
vi.stubEnv("QB_TABLE_ID_2", QB_TABLE_ID_2);
vi.stubEnv("QB_USERNAME", QB_USERNAME);
vi.stubEnv("QB_PASSWORD", QB_PASSWORD);
vi.stubEnv("QB_APP_TOKEN", QB_APP_TOKEN);

export const createClient = (
  fetchApi?: any,
  config: Partial<QuickbaseConfig> = {}
) => {
  const client = quickbase({
    realm: QB_REALM,
    userToken: QB_USER_TOKEN,
    credentials: {
      username: QB_USERNAME,
      password: QB_PASSWORD,
      appToken: QB_APP_TOKEN,
    },
    debug: true,
    fetchApi,
    throttle: { rate: 10, burst: 10 },
    ...config,
  });
  console.log("[createClient] Config:", {
    realm: QB_REALM,
    userToken: QB_USER_TOKEN,
    credentials: {
      username: QB_USERNAME,
      password: QB_PASSWORD,
      appToken: QB_APP_TOKEN,
    },
    debug: true,
    throttle: { rate: 10, burst: 10 },
    ...config,
  });
  console.log("[createClient] Returning:", client);
  return client;
};
