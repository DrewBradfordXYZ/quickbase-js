// tests/vitest/qb/tables/updateRelationship.test.ts

import { describe, it, expect } from "vitest";
import {
  createClient,
  QB_REALM,
  QB_USER_TOKEN,
  QB_TABLE_ID_1,
  QB_TABLE_ID_2,
} from "@tests/setup.ts";
import {
  UpdateRelationshipRequest,
  CreateFieldRequest,
} from "@/generated/models";

describe("QuickbaseClient Integration - updateRelationship", () => {
  let client: ReturnType<typeof createClient>;
  let relationshipId: number;
  let newLookupFieldId: number | undefined;
  let newChildFieldId: number | undefined;
  let generatedLookupFieldId: number | undefined;
  let generatedSummaryFieldId: number | undefined;

  // No beforeAll/afterAll since we'll create and delete within the test

  it("creates, updates, deletes, and verifies a relationship", async () => {
    // Validate environment variables
    if (!QB_REALM) throw new Error("QB_REALM is not defined in .env");
    if (!QB_USER_TOKEN) throw new Error("QB_USER_TOKEN is not defined in .env");
    if (!QB_TABLE_ID_1) throw new Error("QB_TABLE_ID_1 is not defined in .env");
    if (!QB_TABLE_ID_2) throw new Error("QB_TABLE_ID_2 is not defined in .env");

    // Initialize client
    client = createClient(fetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
    });

    // Step 1: Create fields for the relationship update
    const lookupFieldRequest: CreateFieldRequest = {
      label: `Test Lookup Field_${Date.now()}`,
      fieldType: "text",
    };
    const lookupResponse = await client.createField({
      tableId: QB_TABLE_ID_1,
      body: lookupFieldRequest,
    });
    newLookupFieldId = lookupResponse.id;
    if (!newLookupFieldId) {
      throw new Error("Failed to retrieve ID for newly created lookup field");
    }
    console.log(
      `Created lookup field with ID ${newLookupFieldId} in parent table ${QB_TABLE_ID_1}`
    );

    const childFieldRequest: CreateFieldRequest = {
      label: `Test Child Numeric_${Date.now()}`,
      fieldType: "numeric",
    };
    const childResponse = await client.createField({
      tableId: QB_TABLE_ID_2,
      body: childFieldRequest,
    });
    newChildFieldId = childResponse.id;
    if (!newChildFieldId) {
      throw new Error("Failed to retrieve ID for newly created child field");
    }
    console.log(
      `Created child field with ID ${newChildFieldId} in child table ${QB_TABLE_ID_2}`
    );

    // Step 2: Create a new relationship
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

    console.log("Creating relationship with:", createRequestBody);
    const createResponse = await client.createRelationship({
      tableId: QB_TABLE_ID_2,
      body: createRequestBody,
    });
    console.log(
      "Created relationship response:",
      JSON.stringify(createResponse, null, 2)
    );

    expect(createResponse).toBeDefined();
    expect(createResponse.id).toBeDefined();
    expect(createResponse.parentTableId).toBe(QB_TABLE_ID_1);
    expect(createResponse.childTableId).toBe(QB_TABLE_ID_2);
    expect(createResponse.foreignKeyField?.label).toBe(uniqueLabel);

    relationshipId = createResponse.id;

    // Step 3: Update the relationship - Add a lookup field
    const tableId = QB_TABLE_ID_2;
    const initialResponse = await client.getRelationships({ tableId });
    const initialRelationship = initialResponse.relationships.find(
      (r) => r.id === relationshipId
    );
    const currentLookupFields = (initialRelationship?.lookupFields || []).map(
      (f) => f.id
    );
    console.log("Current lookupFields before update:", currentLookupFields);

    const updateLookupRequest: UpdateRelationshipRequest = {
      lookupFieldIds: [newLookupFieldId!],
    };
    console.log(
      "Adding lookup field request:",
      JSON.stringify(updateLookupRequest, null, 2)
    );

    const updateLookupResponse = await client.updateRelationship({
      tableId,
      relationshipId,
      body: updateLookupRequest,
    });
    console.log(
      "Update lookup response:",
      JSON.stringify(updateLookupResponse, null, 2)
    );

    const newLookup = updateLookupResponse.lookupFields.find(
      (f) =>
        f.label.includes("Test Lookup Field") &&
        !currentLookupFields.includes(f.id)
    );
    generatedLookupFieldId = newLookup?.id;
    console.log(
      `Captured generated lookup field ID: ${generatedLookupFieldId}`
    );

    expect(updateLookupResponse.id).toBe(relationshipId);
    expect(updateLookupResponse.childTableId).toBe(QB_TABLE_ID_2);
    expect(updateLookupResponse.parentTableId).toBe(QB_TABLE_ID_1);
    expect(
      updateLookupResponse.lookupFields.some((f) =>
        f.label.includes("Test Lookup Field")
      )
    ).toBe(true);

    // Step 4: Update the relationship - Add a summary field
    const currentSummaryFields = (updateLookupResponse.summaryFields || []).map(
      (f) => f.id
    );
    console.log("Current summaryFields before update:", currentSummaryFields);

    const updateSummaryRequest: UpdateRelationshipRequest = {
      summaryFields: [
        {
          summaryFid: newChildFieldId!,
          label: "Test Summary Field",
          accumulationType: "SUM",
        },
      ],
    };
    console.log(
      "Adding summary field request:",
      JSON.stringify(updateSummaryRequest, null, 2)
    );

    const updateSummaryResponse = await client.updateRelationship({
      tableId,
      relationshipId,
      body: updateSummaryRequest,
    });
    console.log(
      "Update summary response:",
      JSON.stringify(updateSummaryResponse, null, 2)
    );

    const newSummary = updateSummaryResponse.summaryFields.find(
      (f) =>
        f.label.includes("Test Summary Field") &&
        !currentSummaryFields.includes(f.id)
    );
    generatedSummaryFieldId = newSummary?.id;
    console.log(
      `Captured generated summary field ID: ${generatedSummaryFieldId}`
    );

    expect(updateSummaryResponse.id).toBe(relationshipId);
    expect(updateSummaryResponse.childTableId).toBe(QB_TABLE_ID_2);
    expect(updateSummaryResponse.parentTableId).toBe(QB_TABLE_ID_1);
    expect(
      updateSummaryResponse.summaryFields.some((f) =>
        f.label.includes("Test Summary Field")
      )
    ).toBe(true);

    // Step 5: Delete the relationship
    console.log("Deleting relationship with ID:", relationshipId);
    const deleteResponse = await client.deleteRelationship({
      tableId: QB_TABLE_ID_2,
      relationshipId,
    });
    console.log(
      "Delete relationship response:",
      JSON.stringify(deleteResponse, null, 2)
    );

    expect(deleteResponse).toBeDefined();
    expect(deleteResponse.relationshipId).toBe(relationshipId);

    // Step 6: Verify deletion
    const relationships = await client.getRelationships({
      tableId: QB_TABLE_ID_2,
    });
    console.log(
      "Relationships after deletion:",
      JSON.stringify(relationships, null, 2)
    );
    const deletedRelationship = relationships.relationships.find(
      (r) => r.id === relationshipId
    );
    expect(deletedRelationship).toBeUndefined(); // Confirm relationship is gone

    // Cleanup remaining fields from setup
    if (newLookupFieldId) {
      await client.deleteFields({
        tableId: QB_TABLE_ID_1,
        body: { fieldIds: [newLookupFieldId] },
      });
      console.log(
        `Deleted lookup field ${newLookupFieldId} from ${QB_TABLE_ID_1}`
      );
    }
    if (newChildFieldId) {
      await client.deleteFields({
        tableId: QB_TABLE_ID_2,
        body: { fieldIds: [newChildFieldId] },
      });
      console.log(
        `Deleted child field ${newChildFieldId} from ${QB_TABLE_ID_2}`
      );
    }
  }, 60000);
});
