// tests/setup.ts
import { vi } from "vitest";
import { quickbase } from "../src/client/quickbaseClient";
import type { QuickbaseConfig } from "../src/client/quickbaseClient";
import { TicketInMemorySessionSource } from "../src/auth/credential-sources/credentialSources";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const mockFetch = vi.fn();

export const QB_REALM = process.env.QB_REALM || "builderprogram-dbradford6815";
export const QB_USER_TOKEN =
  process.env.QB_USER_TOKEN || "b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3"; // Updated from env
export const QB_APP_ID = process.env.QB_APP_ID || "buwai2zpe"; // Updated from tests
export const QB_TABLE_ID_1 = process.env.QB_TABLE_ID_1 || "buwai2zr4"; // Updated to valid table
export const QB_TABLE_ID_2 = process.env.QB_TABLE_ID_2 || "buwai2zud"; // Updated to valid table
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
  const defaultConfig: Partial<QuickbaseConfig> = {
    realm: QB_REALM,
    userToken: QB_USER_TOKEN,
    debug: true,
    fetchApi,
    throttle: { rate: 10, burst: 10 },
    useTicketAuth: false, // Default to UserTokenStrategy
  };

  const finalConfig: Partial<QuickbaseConfig> = { ...defaultConfig, ...config };

  // Add default credential source for ticket authentication
  if (
    finalConfig.useTicketAuth &&
    !finalConfig.credentialSource &&
    !finalConfig.ticketPromptSessionSource &&
    !finalConfig.ticketLocalStorageSessionSource &&
    !finalConfig.ticketInMemorySessionSource
  ) {
    finalConfig.ticketInMemorySessionSource = {
      initialCredentials: {
        username: QB_USERNAME,
        password: QB_PASSWORD,
        appToken: QB_APP_TOKEN,
      },
      debug: finalConfig.debug,
    };
  }

  const client = quickbase(finalConfig);
  console.log("[createClient] Config:", {
    realm: finalConfig.realm,
    userToken: finalConfig.userToken,
    useTicketAuth: finalConfig.useTicketAuth,
    ticketInMemorySessionSource: finalConfig.ticketInMemorySessionSource,
    debug: finalConfig.debug,
    throttle: finalConfig.throttle,
    ...finalConfig,
  });
  console.log("[createClient] Returning:", client);
  return client;
};
