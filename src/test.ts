import { createQuickbaseClient } from "./QuickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

async function runTest() {
  const client = createQuickbaseClient({
    realm: process.env.QB_REALM!,
    userToken: process.env.QB_USER_TOKEN!,
    debug: false, // Set to true for verbose logs
  });

  const appId = process.env.QB_APP_ID!;
  const app = await client.getApp({ appId });
  console.log("App:", app);
}

runTest().catch(console.error);