/**
 * Integration tests for schema introspection
 *
 * Tests getTables, getFields, getApp, and related metadata operations.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { skipIfNoCredentials, createTestClient, TEST_CONTEXT_PATH, TestContext } from './setup.js';

describe.skipIf(skipIfNoCredentials())('Schema Introspection Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let appId: string;
  let tableId: string;
  let textFieldId: number;
  let numberFieldId: number;
  let dateFieldId: number;
  let checkboxFieldId: number;

  beforeAll(() => {
    if (!existsSync(TEST_CONTEXT_PATH)) {
      throw new Error('Test context not found - globalSetup may have failed');
    }
    const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    client = createTestClient();
    appId = ctx.appId;
    tableId = ctx.tableId;
    textFieldId = ctx.textFieldId;
    numberFieldId = ctx.numberFieldId;
    dateFieldId = ctx.dateFieldId;
    checkboxFieldId = ctx.checkboxFieldId;
  });

  describe('App operations', () => {
    it('should get app details', async () => {
      const app = await client.getApp({ appId });

      expect(app.id).toBe(appId);
      expect(app.name).toContain('test-v2-');
      expect(app.description).toBe('Integration test app - safe to delete');
    });
  });

  describe('Table operations', () => {
    it('should get tables for app', async () => {
      const tables = await client.getAppTables({ appId });

      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThanOrEqual(1);

      // Find our test table
      const testTable = tables.find((t) => t.id === tableId);
      expect(testTable).toBeDefined();
      expect(testTable!.name).toBe('TestRecords');
    });

    it('should get single table details', async () => {
      const table = await client.getTable({ appId, tableId });

      expect(table.id).toBe(tableId);
      expect(table.name).toBe('TestRecords');
      expect(table.description).toBe('Integration test table');
    });
  });

  describe('Field operations', () => {
    it('should get fields for table', async () => {
      const fields = await client.getFields({ tableId });

      expect(Array.isArray(fields)).toBe(true);
      // Should have at least our 4 custom fields plus built-in fields
      expect(fields.length).toBeGreaterThanOrEqual(4);

      // Verify our custom fields exist
      const fieldIds = fields.map((f) => f.id);
      expect(fieldIds).toContain(textFieldId);
      expect(fieldIds).toContain(numberFieldId);
      expect(fieldIds).toContain(dateFieldId);
      expect(fieldIds).toContain(checkboxFieldId);
    });

    it('should get single field details', async () => {
      const field = await client.getField({ tableId, fieldId: textFieldId });

      expect(field.id).toBe(textFieldId);
      expect(field.label).toBe('Name');
      expect(field.fieldType).toBe('text');
    });

    it('should return correct field types', async () => {
      const fields = await client.getFields({ tableId });

      const textField = fields.find((f) => f.id === textFieldId);
      const numberField = fields.find((f) => f.id === numberFieldId);
      const dateField = fields.find((f) => f.id === dateFieldId);
      const checkboxField = fields.find((f) => f.id === checkboxFieldId);

      expect(textField?.fieldType).toBe('text');
      expect(numberField?.fieldType).toBe('numeric');
      expect(dateField?.fieldType).toBe('date');
      expect(checkboxField?.fieldType).toBe('checkbox');
    });

    it('should include built-in fields', async () => {
      const fields = await client.getFields({ tableId });

      // Record ID# is always field 3
      const recordIdField = fields.find((f) => f.id === 3);
      expect(recordIdField).toBeDefined();
      expect(recordIdField!.label).toBe('Record ID#');

      // Date Created is always field 1
      const dateCreatedField = fields.find((f) => f.id === 1);
      expect(dateCreatedField).toBeDefined();

      // Date Modified is always field 2
      const dateModifiedField = fields.find((f) => f.id === 2);
      expect(dateModifiedField).toBeDefined();
    });
  });

  describe('Field creation and update', () => {
    it('should create a new field', async () => {
      const newField = await client.createField(
        { tableId },
        { label: 'TempField', fieldType: 'text' }
      );

      expect(newField.id).toBeDefined();
      expect(newField.label).toBe('TempField');
      expect(newField.fieldType).toBe('text');

      // Clean up - delete the field
      await client.deleteFields({ tableId }, { fieldIds: [newField.id!] });
    });

    it('should update field properties', async () => {
      // Create a temporary field to update
      const tempField = await client.createField(
        { tableId },
        { label: 'ToUpdate', fieldType: 'text' }
      );

      // Update the field
      const updated = await client.updateField(
        { tableId, fieldId: tempField.id! },
        { label: 'UpdatedLabel' }
      );

      expect(updated.label).toBe('UpdatedLabel');

      // Clean up
      await client.deleteFields({ tableId }, { fieldIds: [tempField.id!] });
    });

    it('should delete fields', async () => {
      // Create fields to delete
      const field1 = await client.createField(
        { tableId },
        { label: 'ToDelete1', fieldType: 'text' }
      );
      const field2 = await client.createField(
        { tableId },
        { label: 'ToDelete2', fieldType: 'text' }
      );

      // Delete both fields
      const result = await client.deleteFields(
        { tableId },
        { fieldIds: [field1.id!, field2.id!] }
      );

      expect(result.deletedFieldIds).toContain(field1.id);
      expect(result.deletedFieldIds).toContain(field2.id);

      // Verify they're gone
      const fields = await client.getFields({ tableId });
      const fieldIds = fields.map((f) => f.id);
      expect(fieldIds).not.toContain(field1.id);
      expect(fieldIds).not.toContain(field2.id);
    });
  });
});
