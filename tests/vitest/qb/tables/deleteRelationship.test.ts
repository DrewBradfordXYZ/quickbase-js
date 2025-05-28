// tests/vitest/qb/tables/deleteRelationship.test.ts

import { test, expect } from "vitest";
import { quickbase } from "../../../../src/client/quickbaseClient";
import {
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
  QB_TABLE_ID_2,
} from "/home/drew/Projects/quickbase-js/tests/setup.ts";

test(
  "QuickbaseClient Integration - deleteRelationship > creates and deletes a relationship in QuickBase",
  { timeout: 60000 }, // 60 seconds for two API calls
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

    // Step 1: Create a relationship
    const uniqueLabel = `TestRelationship_${Date.now()}`;
    const createRequestBody = {
      parentTableId: QB_TABLE_ID_1,
      foreignKeyField: { label: uniqueLabel },
      lookupFieldIds: [6], // Assuming field 6 exists in QB_TABLE_ID_1
      summaryFields: [
        {
          summaryFid: 6, // Assuming field 6 in QB_TABLE_ID_2 is numeric
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
    console.log("Creating relationship with:", createRequestBody);

    const createResponse = await client.createRelationship({
      tableId: QB_TABLE_ID_2,
      body: createRequestBody,
    });

    console.log(
      "Created relationship response:",
      JSON.stringify(createResponse, null, 2)
    );

    // Verify creation
    expect(createResponse).toBeDefined();
    expect(createResponse.id).toBeDefined();
    expect(createResponse.parentTableId).toBe(QB_TABLE_ID_1);
    expect(createResponse.childTableId).toBe(QB_TABLE_ID_2);
    expect(createResponse.foreignKeyField).toBeDefined();
    expect(createResponse.foreignKeyField?.label).toBe(uniqueLabel);

    const relationshipId = createResponse.id;
    const foreignKeyFieldId = createResponse.foreignKeyField?.id;

    // Step 2: Delete the relationship
    console.log("Deleting relationship with ID:", relationshipId);
    const deleteResponse = await client.deleteRelationship({
      tableId: QB_TABLE_ID_2,
      relationshipId,
    });

    console.log(
      "Delete relationship response:",
      JSON.stringify(deleteResponse, null, 2)
    );

    // Verify deletion (adjusted to match actual response)
    expect(deleteResponse).toBeDefined();
    expect(deleteResponse.relationshipId).toBe(relationshipId); // Updated to use "relationshipId"

    // Step 3: Confirm relationship is gone (or non-functional)
    try {
      const relationships = await client.getRelationships({
        tableId: QB_TABLE_ID_2,
      });
      console.log(
        "Relationships after deletion:",
        JSON.stringify(relationships, null, 2)
      );
      // Check if the relationship is still listed (metadata might persist)
      const deletedRelationship = relationships.relationships.find(
        (r) => r.id === relationshipId
      );
      if (deletedRelationship) {
        console.log("Relationship metadata persists:", deletedRelationship);
        expect(deletedRelationship.foreignKeyField).toBeUndefined(); // Should lack fields
      }
    } catch (error) {
      console.error("Error fetching relationships post-deletion:", error);
      expect(error.message).toMatch(/404|not found/i); // Optional stricter check
    }

    // Cleanup remaining fields
    const lookupFieldId = createResponse.lookupFields[0]?.id;
    const summaryFieldId = createResponse.summaryFields[0]?.id;

    if (foreignKeyFieldId) {
      await client.deleteFields({
        tableId: QB_TABLE_ID_2,
        body: { fieldIds: [foreignKeyFieldId] },
      });
      console.log(
        `Deleted foreign key field ${foreignKeyFieldId} from ${QB_TABLE_ID_2}`
      );
    }
    if (lookupFieldId) {
      await client.deleteFields({
        tableId: QB_TABLE_ID_2,
        body: { fieldIds: [lookupFieldId] },
      });
      console.log(
        `Deleted lookup field ${lookupFieldId} from ${QB_TABLE_ID_2}`
      );
    }
    if (summaryFieldId) {
      await client.deleteFields({
        tableId: QB_TABLE_ID_1,
        body: { fieldIds: [summaryFieldId] },
      });
      console.log(
        `Deleted summary field ${summaryFieldId} from ${QB_TABLE_ID_1}`
      );
    }
  }
);
