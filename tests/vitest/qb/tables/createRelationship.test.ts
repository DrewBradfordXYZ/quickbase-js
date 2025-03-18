// tests/vitest/qb/tables/createRelationship.test.ts

import { test, expect } from "vitest";
import { quickbase } from "/home/drew/Projects/quickbase-js/src/quickbaseClient";
import {
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
  QB_TABLE_ID_2,
} from "/home/drew/Projects/quickbase-js/tests/setup.ts";

test(
  "QuickbaseClient Integration - createRelationship > creates a new relationship in QuickBase",
  { timeout: 30000 },
  async () => {
    // Validate environment variables
    if (!QB_REALM) throw new Error("QB_REALM is not defined in .env");
    if (!QB_USER_TOKEN) throw new Error("QB_USER_TOKEN is not defined in .env");
    if (!QB_TABLE_ID_1) throw new Error("QB_TABLE_ID_1 is not defined in .env");
    if (!QB_TABLE_ID_2) throw new Error("QB_TABLE_ID_2 is not defined in .env");

    // Initialize client
    const client = quickbase({
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
    });

    // Define the relationship creation request
    const uniqueLabel = `TestRelationship_${Date.now()}`;
    const requestBody = {
      parentTableId: QB_TABLE_ID_1,
      foreignKeyField: { label: uniqueLabel },
      lookupFieldIds: [6], // Assuming field 6 exists in QB_TABLE_ID_1 (e.g., a numeric field)
      summaryFields: [
        {
          summaryFid: 6, // Assuming field 6 in QB_TABLE_ID_2 is numeric for a SUM
          label: `Sum_${uniqueLabel}`,
          accumulationType: "SUM",
        },
      ],
    };

    console.log("Config used:", {
      realm: QB_REALM,
      userToken: "[REDACTED]",
      parentTableId: QB_TABLE_ID_1,
      childTableId: QB_TABLE_ID_2,
    });
    console.log("Creating relationship with:", requestBody);

    // Create the relationship
    const response = await client.createRelationship({
      tableId: QB_TABLE_ID_2,
      body: requestBody,
    });

    console.log("Real API response:", JSON.stringify(response, null, 2));

    // Assertions
    expect(response).toBeDefined();
    expect(response.id).toBeDefined(); // Relationship ID assigned by QuickBase
    expect(response.parentTableId).toBe(QB_TABLE_ID_1);
    expect(response.childTableId).toBe(QB_TABLE_ID_2);
    expect(response.foreignKeyField).toBeDefined();
    expect(response.foreignKeyField?.label).toBe(uniqueLabel);
    expect(response.lookupFields).toHaveLength(1);
    expect(response.lookupFields[0].id).toBeGreaterThan(0); // Generated lookup field ID
    expect(response.summaryFields).toHaveLength(1);
    expect(response.summaryFields[0].label).toBe(`Sum_${uniqueLabel}`);
  }
);
