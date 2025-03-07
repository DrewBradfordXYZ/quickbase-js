import { quickbaseClient } from "../src/quickbaseClient.ts";
import dotenv from "dotenv";
import { vi } from "vitest";

dotenv.config();

export const createClient = (fetchApi?: any) =>
  quickbaseClient({
    realm: process.env.QB_REALM || "default-realm",
    userToken: process.env.QB_USER_TOKEN || "default-token",
    debug: true,
    fetchApi,
  });

export const mockFetch = vi.fn();
