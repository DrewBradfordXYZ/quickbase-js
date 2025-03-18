import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
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

  beforeAll(async () => {
    client = createClient(fetch, {
      realm: QB_REALM,
      userToken: QB_USER_TOKEN,
      debug: true,
    });

    if (!QB_REALM) throw new Error("QB_REALM is not defined in .env");
    if (!QB_USER_TOKEN) throw new Error("QB_USER_TOKEN is not defined in .env");

    const relationshipsResponse = await client.getRelationships({
      tableId: QB_TABLE_ID_2,
      skip: 0,
    });
    console.log(
      "Initial relationships response:",
      JSON.stringify(relationshipsResponse, null, 2)
    );
    const relationship = relationshipsResponse.relationships.find(
      (r) => r.parentTableId === QB_TABLE_ID_1
    );
    if (!relationship) {
      throw new Error(
        `No relationship found between parent ${QB_TABLE_ID_1} and child ${QB_TABLE_ID_2}`
      );
    }
    relationshipId = relationship.id;
    console.log(`Identified relationshipId: ${relationshipId}`);

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

    console.log(
      `Setup complete: relationshipId=${relationshipId}, lookupFieldId=${newLookupFieldId}, childFieldId=${newChildFieldId}`
    );
  }, 30000);

  afterAll(async () => {
    if (newLookupFieldId) {
      try {
        const deleteLookupResponse = await client.deleteFields({
          tableId: QB_TABLE_ID_1,
          body: { fieldIds: [newLookupFieldId] },
        });
        console.log(
          `Deleted original lookup field ${newLookupFieldId} from ${QB_TABLE_ID_1}:`,
          JSON.stringify(deleteLookupResponse, null, 2)
        );
      } catch (error) {
        console.error(
          `Failed to delete original lookup field ${newLookupFieldId}:`,
          error
        );
        throw error;
      }
    }
    if (newChildFieldId) {
      try {
        const deleteChildResponse = await client.deleteFields({
          tableId: QB_TABLE_ID_2,
          body: { fieldIds: [newChildFieldId] },
        });
        console.log(
          `Deleted original child field ${newChildFieldId} from ${QB_TABLE_ID_2}:`,
          JSON.stringify(deleteChildResponse, null, 2)
        );
      } catch (error) {
        console.error(
          `Failed to delete original child field ${newChildFieldId}:`,
          error
        );
        throw error;
      }
    }
    if (generatedLookupFieldId) {
      try {
        const deleteGeneratedLookupResponse = await client.deleteFields({
          tableId: QB_TABLE_ID_2,
          body: { fieldIds: [generatedLookupFieldId] },
        });
        console.log(
          `Deleted generated lookup field ${generatedLookupFieldId} from ${QB_TABLE_ID_2}:`,
          JSON.stringify(deleteGeneratedLookupResponse, null, 2)
        );
      } catch (error) {
        console.error(
          `Failed to delete generated lookup field ${generatedLookupFieldId}:`,
          error
        );
        throw error;
      }
    }
    if (generatedSummaryFieldId) {
      try {
        const deleteGeneratedSummaryResponse = await client.deleteFields({
          tableId: QB_TABLE_ID_1,
          body: { fieldIds: [generatedSummaryFieldId] },
        });
        console.log(
          `Deleted generated summary field ${generatedSummaryFieldId} from ${QB_TABLE_ID_1}:`,
          JSON.stringify(deleteGeneratedSummaryResponse, null, 2)
        );
      } catch (error) {
        console.error(
          `Failed to delete generated summary field ${generatedSummaryFieldId}:`,
          error
        );
        throw error;
      }
    }
  }, 30000);

  beforeEach(async () => {
    const relationshipsResponse = await client.getRelationships({
      tableId: QB_TABLE_ID_2,
    });
    const relationship = relationshipsResponse.relationships.find(
      (r) => r.id === relationshipId
    );
    if (!relationship) {
      throw new Error(`Relationship ${relationshipId} not found before test`);
    }
    console.log(
      "Relationship state before test:",
      JSON.stringify(relationship, null, 2)
    );
  }, 30000);

  it("adds a lookup field to the relationship", async ({ expect }) => {
    const tableId = QB_TABLE_ID_2;
    const initialResponse = await client.getRelationships({ tableId });
    const initialRelationship = initialResponse.relationships.find(
      (r) => r.id === relationshipId
    );
    const currentLookupFields = (initialRelationship?.lookupFields || []).map(
      (f) => f.id
    );
    console.log("Current lookupFields before update:", currentLookupFields);

    const request: UpdateRelationshipRequest = {
      lookupFieldIds: [newLookupFieldId!],
    };
    console.log(
      "Adding lookup field request:",
      JSON.stringify(request, null, 2)
    );

    const updateResponse = await client.updateRelationship({
      tableId,
      relationshipId,
      body: request,
    });
    console.log("Update response:", JSON.stringify(updateResponse, null, 2));

    const newLookup = updateResponse.lookupFields.find(
      (f) =>
        f.label.includes("Test Lookup Field") &&
        !currentLookupFields.includes(f.id)
    );
    generatedLookupFieldId = newLookup?.id;
    console.log(
      `Captured generated lookup field ID: ${generatedLookupFieldId}`
    );

    expect(updateResponse.id).toBe(relationshipId);
    expect(updateResponse.childTableId).toBe(QB_TABLE_ID_2);
    expect(updateResponse.parentTableId).toBe(QB_TABLE_ID_1);
    expect(
      updateResponse.lookupFields.some((f) =>
        f.label.includes("Test Lookup Field")
      )
    ).toBe(true);
    expect(updateResponse.lookupFields.some((f) => f.id === 19)).toBe(true);
  }, 30000);

  it("adds a summary field to the parent table", async ({ expect }) => {
    const tableId = QB_TABLE_ID_2;
    const initialResponse = await client.getRelationships({ tableId });
    const initialRelationship = initialResponse.relationships.find(
      (r) => r.id === relationshipId
    );
    const currentSummaryFields = (initialRelationship?.summaryFields || []).map(
      (f) => f.id
    );
    console.log("Current summaryFields before update:", currentSummaryFields);

    const request: UpdateRelationshipRequest = {
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
      JSON.stringify(request, null, 2)
    );

    const updateResponse = await client.updateRelationship({
      tableId,
      relationshipId,
      body: request,
    });
    console.log("Update response:", JSON.stringify(updateResponse, null, 2));

    const newSummary = updateResponse.summaryFields.find(
      (f) =>
        f.label.includes("Test Summary Field") &&
        !currentSummaryFields.includes(f.id)
    );
    generatedSummaryFieldId = newSummary?.id;
    console.log(
      `Captured generated summary field ID: ${generatedSummaryFieldId}`
    );

    expect(updateResponse.id).toBe(relationshipId);
    expect(updateResponse.childTableId).toBe(QB_TABLE_ID_2);
    expect(updateResponse.parentTableId).toBe(QB_TABLE_ID_1);
    expect(
      updateResponse.summaryFields.some((f) =>
        f.label.includes("Test Summary Field")
      )
    ).toBe(true);
  }, 30000);
});
