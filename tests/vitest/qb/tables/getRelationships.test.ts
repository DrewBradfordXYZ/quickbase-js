// tests/vitest/qb/tables/getRelationships.test.ts
import { describe, test, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";
import { QB_TABLE_ID_1 } from "/home/drew/Projects/quickbase-js/tests/setup.ts";
import { GetRelationships200Response } from "/home/drew/Projects/quickbase-js/src/generated/models";

describe("QuickbaseClient Integration - getRelationships", () => {
  const qb = quickbase({
    realm: process.env.QB_REALM || "builderprogram-dbradford6815",
    userToken: process.env.QB_USER_TOKEN || "",
    debug: true,
  });

  test("fetches real relationships from QuickBase", async () => {
    // Ensure environment variables are set
    if (!process.env.QB_REALM)
      throw new Error("QB_REALM is not defined in .env");
    if (!process.env.QB_USER_TOKEN)
      throw new Error("QB_USER_TOKEN is not defined in .env");

    console.log("Config used:", {
      realm: process.env.QB_REALM,
      userToken: process.env.QB_USER_TOKEN,
      tableId: QB_TABLE_ID_1,
    });

    const response: GetRelationships200Response = await qb.getRelationships({
      tableId: QB_TABLE_ID_1, // Query relationships for QB_TABLE_ID_1 (e.g., "buwai2zws")
      skip: 0,
    });

    console.log("Real API response:", JSON.stringify(response, null, 2));

    // Basic structure validation
    expect(response).toBeDefined();
    expect(response.metadata).toBeDefined();
    expect(response.metadata).toHaveProperty(
      "numRelationships",
      expect.any(Number)
    );
    expect(response.metadata).toHaveProperty("skip", 0);
    expect(response.metadata).toHaveProperty(
      "totalRelationships",
      expect.any(Number)
    );
    expect(response.relationships).toBeDefined();
    expect(Array.isArray(response.relationships)).toBe(true);

    // If relationships exist, validate the first one
    if (response.relationships.length > 0) {
      const relationship = response.relationships[0];
      expect(relationship).toHaveProperty("id", expect.any(Number));
      expect(relationship).toHaveProperty("parentTableId", expect.any(String));
      expect(relationship).toHaveProperty("childTableId", QB_TABLE_ID_1);
      expect(relationship).toHaveProperty("foreignKeyField");
      expect(relationship.foreignKeyField).toHaveProperty(
        "id",
        expect.any(Number)
      );
      expect(relationship.foreignKeyField).toHaveProperty(
        "label",
        expect.any(String)
      );
      expect(relationship.foreignKeyField).toHaveProperty(
        "type",
        expect.any(String)
      );
      expect(relationship).toHaveProperty("isCrossApp", expect.any(Boolean));
      expect(relationship).toHaveProperty("lookupFields", expect.any(Array));

      // summaryFields is optional; only validate if present
      if (
        "summaryFields" in relationship &&
        relationship.summaryFields !== undefined
      ) {
        expect(Array.isArray(relationship.summaryFields)).toBe(true);
      }
    }
  }, 10000); // Timeout as second argument
});
