import { quickbaseClient } from "./quickbaseClient.ts";
import dotenv from "dotenv";

dotenv.config({ path: ".env.development" });

async function runTest() {
  const client = quickbaseClient({
    realm: process.env.QB_REALM!,
    userToken: process.env.QB_USER_TOKEN!,
    debug: true,
  });

  const app = await client.getApp({ appId: process.env.QB_APP_ID! });
  const fields = await client.getFields({ tableId: process.env.QB_TABLE_ID! });
  console.log("App:", app);
  console.log("Fields:", fields);
}

runTest().catch(console.error);
