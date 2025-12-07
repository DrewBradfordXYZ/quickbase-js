/**
 * Integration tests for XML API module
 *
 * Tests XML-only endpoints against a real QuickBase instance.
 * These endpoints provide functionality not available in the JSON API.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import {
  skipIfNoCredentials,
  createTestClient,
  hasTicketCredentials,
  QB_REALM,
  QB_USERNAME,
  QB_PASSWORD,
  TEST_CONTEXT_PATH,
  TestContext,
} from './setup.js';
import { createXmlClient, createClient } from '../../src/index.js';

describe.skipIf(skipIfNoCredentials())('XML API Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let xml: ReturnType<typeof createXmlClient>;
  let appId: string;
  let tableId: string;
  let textFieldId: number;
  let numberFieldId: number;

  beforeAll(() => {
    if (!existsSync(TEST_CONTEXT_PATH)) {
      throw new Error('Test context not found - globalSetup may have failed');
    }
    const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    client = createTestClient();
    xml = createXmlClient(client);
    appId = ctx.appId;
    tableId = ctx.tableId;
    textFieldId = ctx.textFieldId;
    numberFieldId = ctx.numberFieldId;
  });

  // Helper to clean up records between tests
  async function deleteAllRecords() {
    try {
      await client.deleteRecords({
        from: tableId,
        where: '{3.GT.0}',
      });
    } catch {
      // Ignore if no records exist
    }
  }

  // Helper to insert test records
  async function insertTestRecords(count: number) {
    const records = Array.from({ length: count }, (_, i) => ({
      [textFieldId]: { value: `Record ${i + 1}` },
      [numberFieldId]: { value: i + 1 },
    }));
    await client.upsert({ to: tableId, data: records });
  }

  // Helper to get first record ID
  async function getFirstRecordId(): Promise<number> {
    const result = await client.runQuery({
      from: tableId,
      select: [3],
    });
    if (!result.data || result.data.length === 0) {
      throw new Error('No records found');
    }
    return result.data[0]['3'].value as number;
  }

  describe('GrantedDBs', () => {
    it('lists accessible apps', async () => {
      const result = await xml.grantedDBs({ realmAppsOnly: true });

      expect(result.databases.length).toBeGreaterThan(0);

      // Our test app should be in the list
      const found = result.databases.some((db) => db.dbid === appId);
      expect(found).toBe(true);
    });

    it('excludes parents when requested', async () => {
      const result = await xml.grantedDBs({
        realmAppsOnly: true,
        excludeParents: true,
      });

      // Just verify the call works - returns tables only
      expect(Array.isArray(result.databases)).toBe(true);
    });
  });

  describe('GetDBInfo', () => {
    it('gets app info', async () => {
      const result = await xml.getDBInfo(appId);

      expect(result.name).toBeTruthy();
      expect(result.managerName).toBeTruthy();
    });

    it('gets table info', async () => {
      const result = await xml.getDBInfo(tableId);

      expect(result.name).toBeTruthy();
      expect(typeof result.numRecords).toBe('number');
    });
  });

  describe('GetNumRecords', () => {
    beforeEach(async () => {
      await deleteAllRecords();
      await insertTestRecords(3);
    });

    it('counts records', async () => {
      const count = await xml.getNumRecords(tableId);

      expect(count).toBe(3);
    });
  });

  describe('DoQueryCount', () => {
    beforeEach(async () => {
      await deleteAllRecords();
      await insertTestRecords(5);
    });

    it('counts all records', async () => {
      const result = await xml.doQueryCount(tableId);

      expect(result.numMatches).toBe(5);
    });

    it('counts filtered records', async () => {
      const query = `{${numberFieldId}.GT.2}`;
      const result = await xml.doQueryCount(tableId, query);

      // Records with Amount > 2 (i.e., 3, 4, 5)
      expect(result.numMatches).toBe(3);
    });
  });

  describe('GetRoleInfo', () => {
    it('gets app roles', async () => {
      const result = await xml.getRoleInfo(appId);

      expect(result.roles.length).toBeGreaterThan(0);

      // Apps have default roles
      for (const role of result.roles) {
        expect(role.id).toBeGreaterThan(0);
        expect(role.name).toBeTruthy();
        expect(role.access).toBeDefined();
      }
    });
  });

  describe('UserRoles', () => {
    it('gets users with roles', async () => {
      const result = await xml.userRoles(appId);

      expect(result.users.length).toBeGreaterThan(0);

      // At least the test user should be present
      for (const user of result.users) {
        expect(user.id).toBeTruthy();
        expect(user.name).toBeTruthy();
        expect(Array.isArray(user.roles)).toBe(true);
      }
    });
  });

  describe('GetSchema', () => {
    it('gets table schema', async () => {
      const result = await xml.getSchema(tableId);

      expect(result.table.name).toBeTruthy();
      expect(result.table.fields).toBeDefined();
      expect(result.table.fields!.length).toBeGreaterThan(0);

      // Verify our test fields exist
      const fieldIds = new Set(result.table.fields!.map((f) => f.id));
      expect(fieldIds.has(textFieldId)).toBe(true);
      expect(fieldIds.has(numberFieldId)).toBe(true);
    });
  });

  describe('GetRecordInfo', () => {
    beforeEach(async () => {
      await deleteAllRecords();
      await insertTestRecords(1);
    });

    it('gets record info', async () => {
      const recordId = await getFirstRecordId();
      const result = await xml.getRecordInfo(tableId, recordId);

      expect(result.recordId).toBe(recordId);
      expect(result.fields.length).toBeGreaterThan(0);

      // Each field should have id, name, type, value
      for (const field of result.fields) {
        expect(field.id).toBeDefined();
        expect(field.name).toBeTruthy();
        expect(field.type).toBeTruthy();
      }
    });
  });

  describe('DBVars', () => {
    const varName = 'test_var';
    const varValue = 'test_value_123';

    it('sets and gets variable', async () => {
      // Set the variable
      await xml.setDBVar(appId, varName, varValue);

      // Get the variable
      const result = await xml.getDBVar(appId, varName);

      expect(result).toBe(varValue);
    });
  });

  describe('GenResultsTable', () => {
    beforeEach(async () => {
      await deleteAllRecords();
      await insertTestRecords(3);
    });

    it('generates CSV results', async () => {
      const result = await xml.genResultsTable(tableId, {
        clist: [3, textFieldId, numberFieldId],
        options: 'csv',
      });

      expect(result).toBeTruthy();
      // Should contain CSV data with commas
      expect(result).toContain(',');
    });

    it('generates HTML results', async () => {
      const result = await xml.genResultsTable(tableId, {
        clist: [3, textFieldId],
        options: 'jht',
      });

      expect(result).toBeTruthy();
      // Should contain JavaScript or HTML
      expect(result.includes('qdbWrite') || result.includes('<')).toBe(true);
    });
  });

  describe('GetRecordAsHTML', () => {
    beforeEach(async () => {
      await deleteAllRecords();
      await insertTestRecords(1);
    });

    it('gets record as HTML', async () => {
      const recordId = await getFirstRecordId();
      const result = await xml.getRecordAsHTML(tableId, { rid: recordId });

      expect(result).toBeTruthy();
      // Should contain HTML or JavaScript output
      expect(typeof result).toBe('string');
    });
  });
});

/**
 * Tests that require ticket authentication
 * These APIs don't work with user tokens
 */
describe.skipIf(!hasTicketCredentials)('XML API - Ticket Auth Required', () => {
  let ticketClient: ReturnType<typeof createClient>;
  let xml: ReturnType<typeof createXmlClient>;
  let appId: string;

  beforeAll(() => {
    if (!existsSync(TEST_CONTEXT_PATH)) {
      throw new Error('Test context not found - globalSetup may have failed');
    }
    const ctx: TestContext = JSON.parse(readFileSync(TEST_CONTEXT_PATH, 'utf-8'));
    appId = ctx.appId;

    // Create client with ticket auth
    ticketClient = createClient({
      realm: QB_REALM!,
      auth: {
        type: 'ticket',
        username: QB_USERNAME!,
        password: QB_PASSWORD!,
      },
    });
    xml = createXmlClient(ticketClient);
  });

  describe('GetAppDTMInfo', () => {
    it('gets app modification info', async () => {
      const result = await xml.getAppDTMInfo(appId);

      expect(result.appId).toBe(appId);
      expect(Array.isArray(result.tables)).toBe(true);
    });
  });

  describe('FindDBByName', () => {
    it('finds app by name', async () => {
      // First get the app name using regular client
      const userTokenClient = createClient({
        realm: QB_REALM!,
        auth: { type: 'user-token', userToken: process.env.QB_USER_TOKEN! },
      });
      const userTokenXml = createXmlClient(userTokenClient);
      const info = await userTokenXml.getDBInfo(appId);

      // Now find it by name using ticket auth
      const result = await xml.findDBByName(info.name, true);

      expect(result.dbid).toBe(appId);
    });
  });
});
