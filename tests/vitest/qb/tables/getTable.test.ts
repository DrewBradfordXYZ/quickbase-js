import { test, expect } from "vitest";
import { quickbase } from "../../../../src/quickbaseClient";

test(
  "QuickbaseClient Integration - getTable > fetches real table data from QuickBase",
  { timeout: 10000 },
  async () => {
    const config = {
      realm: process.env.QB_REALM || "builderprogram-dbradford6815",
      userToken:
        process.env.QB_USER_TOKEN || "b9f3pk_q4jd_0_b4qu5eebyvuix3xs57ysd7zn3",
      debug: true,
    };
    const client = quickbase(config);
    const tableId = "buwai2zr4";
    const appId = "buwai2zpe";

    console.log("Config used:", config);
    const response = await client.getTable({ tableId, appId });
    expect(response).toBeDefined();
    expect(response.id).toBe(tableId);
    expect(response.name).toBe("Root"); // Expect original name
    expect(response.alias).toBe("_DBID_ROOT");
    expect(response.created).toBeInstanceOf(Date);
    console.log("Real API response:", response);
  }
);
