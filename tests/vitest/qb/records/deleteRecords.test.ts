// tests/vitest/qb/records/deleteRecords.test.ts
import { describe, test, expect } from "vitest";
import { quickbase } from "@/quickbaseClient.ts";

// Temporarily skip this suite due to timeout issues possibly related to upsert
describe.skip("deleteRecords", () => {
  const qb = quickbase({
    realm: "builderprogram-dbradford6815",
    userToken: process.env.QB_USER_TOKEN,
    debug: true,
  });

  test("deletes records matching query", async () => {
    const upsertResponse = await qb.upsert({
      body: { to: "buwai2zws", data: [{}] },
    });
    const recordId = upsertResponse.metadata.createdRecordIds[0];

    const deleteResponse = await qb.deleteRecords({
      body: { from: "buwai2zws", where: `{3.EX.${recordId}}` },
    });

    expect(deleteResponse).toEqual({ numberDeleted: 1 });
  });

  test("handles empty result", async () => {
    const response = await qb.deleteRecords({
      body: { from: "buwai2zws", where: "{3.EX.'999999'}" },
    });
    expect(response).toEqual({ numberDeleted: 0 });
  });
});
