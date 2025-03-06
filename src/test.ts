#!/usr/bin/env node
import { config } from "dotenv";
import { createQuickbaseClient } from "./QuickbaseClient.ts"; // Add .ts
import type { App } from "./generated/models/App.ts"; // Add .ts

config({ path: ".env.development" });

const realm = process.env.QB_REALM;
const token = process.env.QB_USER_TOKEN;
const appId = process.env.QB_APP_ID;

const client = createQuickbaseClient({
  realm: realm || "",
  userToken: token || "",
});

async function test() {
  try {
    const app: App = await client.getApp({ appId: appId || "" });
    console.log("App:", app);
  } catch (error) {
    console.error("Error:", (error as Error).message);
  }
}

test();