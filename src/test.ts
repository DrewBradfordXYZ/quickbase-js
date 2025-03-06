import { quickbaseClient } from "./quickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

async function runTest() {
  const client = quickbaseClient({
    realm: process.env.QB_REALM!,
    userToken: process.env.QB_USER_TOKEN!,
    debug: false, // Set to true for verbose logs
  });

  const appId = process.env.QB_APP_ID!;
  const app = await client.getApp({ appId });
    const tableFields = await client.getFields({ tableId: process.env.QB_TABLE_ID! });
  console.log("App:", app);
  console.log("Table Fields:", tableFields);
}

runTest().catch(console.error);