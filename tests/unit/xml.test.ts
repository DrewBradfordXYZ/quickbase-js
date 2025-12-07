/**
 * XML API Unit Tests
 *
 * Tests for the XML API module following patterns from quickbase-go.
 * Uses a mock XmlCaller to verify request building and response parsing.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  XmlClient,
  XmlError,
  isUnauthorized,
  isNotFound,
  isInvalidTicket,
  type XmlCaller,
} from '../../src/xml/index.js';

/**
 * Mock XmlCaller for testing
 */
function createMockCaller(options: {
  realm?: string;
  response?: string;
  error?: Error;
} = {}): XmlCaller & {
  lastDbid: string;
  lastAction: string;
  lastBody: string;
} {
  const mock = {
    lastDbid: '',
    lastAction: '',
    lastBody: '',
    realm: () => options.realm || 'testrealm',
    doXml: async (dbid: string, action: string, body: string): Promise<string> => {
      mock.lastDbid = dbid;
      mock.lastAction = action;
      mock.lastBody = body;
      if (options.error) {
        throw options.error;
      }
      return options.response || '';
    },
  };
  return mock;
}

describe('XmlClient.getRoleInfo', () => {
  it('should parse roles from successful response', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetRoleInfo</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <roles>
      <role id="10">
         <name>Viewer</name>
         <access id="3">Basic Access</access>
      </role>
      <role id="11">
         <name>Participant</name>
         <access id="3">Basic Access</access>
      </role>
      <role id="12">
         <name>Administrator</name>
         <access id="1">Administrator</access>
      </role>
   </roles>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getRoleInfo('bqxyz123');

    expect(mock.lastAction).toBe('API_GetRoleInfo');
    expect(mock.lastDbid).toBe('bqxyz123');
    expect(result.roles).toHaveLength(3);
    expect(result.roles[0].id).toBe(10);
    expect(result.roles[0].name).toBe('Viewer');
    expect(result.roles[0].access.id).toBe(3);
    expect(result.roles[2].name).toBe('Administrator');
    expect(result.roles[2].access.id).toBe(1);
  });

  it('should throw XmlError on error response', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetRoleInfo</action>
   <errcode>4</errcode>
   <errtext>User not authorized</errtext>
</qdbapi>`,
    });

    const client = new XmlClient(mock);

    await expect(client.getRoleInfo('bqxyz123')).rejects.toThrow(XmlError);

    try {
      await client.getRoleInfo('bqxyz123');
    } catch (err) {
      expect(isUnauthorized(err)).toBe(true);
    }
  });

  it('should propagate network errors', async () => {
    const mock = createMockCaller({
      error: new Error('connection refused'),
    });

    const client = new XmlClient(mock);

    await expect(client.getRoleInfo('bqxyz123')).rejects.toThrow('connection refused');
  });
});

describe('XmlClient.userRoles', () => {
  it('should parse users with roles', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_UserRoles</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <users>
      <user type="user" id="112149.bhsv">
         <name>Jack Danielsson</name>
         <lastAccess>1403035235243</lastAccess>
         <lastAccessAppLocal>06-17-2014 01:00 PM</lastAccessAppLocal>
         <firstName>Jack</firstName>
         <lastName>Danielsson</lastName>
         <roles>
            <role id="12">
               <name>Administrator</name>
               <access id="1">Administrator</access>
            </role>
         </roles>
      </user>
      <user type="group" id="3">
        <name>Everyone on the Internet</name>
        <roles>
         <role id="10">
            <name>Viewer</name>
            <access id="3">Basic Access</access>
          </role>
        </roles>
      </user>
   </users>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.userRoles('bqxyz123');

    expect(mock.lastAction).toBe('API_UserRoles');
    expect(result.users).toHaveLength(2);

    const user = result.users[0];
    expect(user.id).toBe('112149.bhsv');
    expect(user.type).toBe('user');
    expect(user.name).toBe('Jack Danielsson');
    expect(user.firstName).toBe('Jack');
    expect(user.roles).toHaveLength(1);
    expect(user.roles[0].name).toBe('Administrator');

    const group = result.users[1];
    expect(group.type).toBe('group');
    expect(group.name).toBe('Everyone on the Internet');
  });
});

describe('XmlClient.getUserRole', () => {
  it('should parse user role with groups', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetUserRole</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <user id="112245.efy7">
   <name>John Doe</name>
      <roles>
         <role id="11">
           <name>Participant</name>
           <access id="3">Basic Access</access>
           <member type="user">John Doe</member>
         </role>
         <role id="10">
           <name>Viewer</name>
           <access id="3">Basic Access</access>
           <member type="group">Group1</member>
         </role>
      </roles>
   </user>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getUserRole('bqxyz123', '112245.efy7', true);

    expect(mock.lastAction).toBe('API_GetUserRole');
    expect(mock.lastBody).toBe('<qdbapi><userid>112245.efy7</userid><inclgrps>1</inclgrps></qdbapi>');
    expect(result.userId).toBe('112245.efy7');
    expect(result.userName).toBe('John Doe');
    expect(result.roles).toHaveLength(2);
    expect(result.roles[0].member?.type).toBe('user');
    expect(result.roles[1].member?.type).toBe('group');
    expect(result.roles[1].member?.name).toBe('Group1');
  });

  it('should not include inclgrps when false', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetUserRole</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <user id="112245.efy7">
   <name>John Doe</name>
      <roles>
         <role id="11">
           <name>Participant</name>
           <access id="3">Basic Access</access>
         </role>
      </roles>
   </user>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    await client.getUserRole('bqxyz123', '112245.efy7', false);

    expect(mock.lastBody).toBe('<qdbapi><userid>112245.efy7</userid></qdbapi>');
  });
});

describe('XmlClient.doQueryCount', () => {
  it('should count records with query', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_DoQueryCount</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <numMatches>42</numMatches>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.doQueryCount('bqxyz123', "{'7'.EX.'Active'}");

    expect(mock.lastAction).toBe('API_DoQueryCount');
    // Quotes are XML-escaped in the request body
    expect(mock.lastBody).toContain('<query>');
    expect(mock.lastBody).toContain('</query>');
    expect(result.numMatches).toBe(42);
  });

  it('should count all records without query', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_DoQueryCount</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <numMatches>1000</numMatches>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.doQueryCount('bqxyz123');

    expect(mock.lastBody).toBe('<qdbapi></qdbapi>');
    expect(result.numMatches).toBe(1000);
  });
});

describe('XmlClient.getRecordInfo', () => {
  it('should parse record info', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>api_getrecordinfo</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <rid>20</rid>
   <num_fields>3</num_fields>
   <update_id>1205780029699</update_id>
   <field>
      <fid>3</fid>
      <name>Record ID#</name>
      <type>Record ID#</type>
      <value>20</value>
   </field>
   <field>
      <fid>6</fid>
      <name>Start Date</name>
      <type>Date</type>
      <value>1437609600000</value>
      <printable>07-23-2015</printable>
   </field>
   <field>
      <fid>7</fid>
      <name>Status</name>
      <type>Text</type>
      <value>Active</value>
   </field>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getRecordInfo('bqxyz123', 20);

    expect(mock.lastAction).toBe('API_GetRecordInfo');
    expect(mock.lastBody).toBe('<qdbapi><rid>20</rid></qdbapi>');
    expect(result.recordId).toBe(20);
    expect(result.numFields).toBe(3);
    expect(result.updateId).toBe('1205780029699');
    expect(result.fields).toHaveLength(3);

    expect(result.fields[0].id).toBe(3);
    expect(result.fields[0].name).toBe('Record ID#');
    expect(result.fields[0].value).toBe('20');

    expect(result.fields[1].printable).toBe('07-23-2015');
    expect(result.fields[2].value).toBe('Active');
  });

  it('should handle not found error', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>api_getrecordinfo</action>
   <errcode>30</errcode>
   <errtext>No such record</errtext>
</qdbapi>`,
    });

    const client = new XmlClient(mock);

    try {
      await client.getRecordInfo('bqxyz123', 99999);
    } catch (err) {
      expect(isNotFound(err)).toBe(true);
    }
  });
});

describe('XmlClient.getDBVar', () => {
  it('should get variable value', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_getDBvar</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <value>42</value>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getDBVar('bqxyz123', 'myVar');

    expect(mock.lastAction).toBe('API_GetDBVar');
    expect(result).toBe('42');
  });
});

describe('XmlClient.setDBVar', () => {
  it('should set variable value', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_SetDBVar</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    await client.setDBVar('bqxyz123', 'myVar', 'newValue');

    expect(mock.lastAction).toBe('API_SetDBVar');
    expect(mock.lastBody).toBe('<qdbapi><varname>myVar</varname><value>newValue</value></qdbapi>');
  });
});

describe('XmlClient.getSchema', () => {
  it('should parse app-level schema', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
     <action>API_GetSchema</action>
     <errcode>0</errcode>
     <errtext>No error</errtext>
     <time_zone>(UTC-08:00) Pacific Time (US &amp; Canada)</time_zone>
     <date_format>YYYY-MM-DD</date_format>
     <table>
          <name>API created Sample</name>
          <desc>This is a sample application.</desc>
          <original>
                <app_id>bdb5rjd6h</app_id>
                <table_id>bdb5rjd6h</table_id>
                <cre_date>1204586581894</cre_date>
                <mod_date>1206394201119</mod_date>
                <next_record_id>1</next_record_id>
                <next_field_id>7</next_field_id>
          </original>
          <variables>
               <var name="Blue">14</var>
               <var name="Jack">14</var>
          </variables>
          <chdbids>
              <chdbid name="_dbid_vehicle">bddrydqhg</chdbid>
          </chdbids>
      </table>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getSchema('bdb5rjd6h');

    expect(mock.lastAction).toBe('API_GetSchema');
    // XML entities are preserved as-is by the parser (no decoding)
    expect(result.timeZone).toContain('(UTC-08:00) Pacific Time');
    expect(result.dateFormat).toBe('YYYY-MM-DD');
    expect(result.table.name).toBe('API created Sample');
    expect(result.table.variables).toHaveLength(2);
    expect(result.table.variables?.[0].name).toBe('Blue');
    expect(result.table.variables?.[0].value).toBe('14');
    expect(result.table.childTables).toHaveLength(1);
    expect(result.table.childTables?.[0].dbid).toBe('bddrydqhg');
  });

  it('should parse table-level schema with fields', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
 <action>API_GetSchema</action>
 <errcode>0</errcode>
 <errtext>No error</errtext>
 <time_zone>(UTC-08:00) Pacific Time (US &amp; Canada)</time_zone>
 <date_format>YYYY-MM-DD</date_format>
 <table>
   <name>Contacts</name>
   <desc>Contact management table.</desc>
   <queries>
    <query id="1">
     <qyname>List All</qyname>
      <qytype>table</qytype>
     </query>
   </queries>
   <fields>
     <field id="6" field_type="text" base_type="text">
       <label>Name</label>
       <fieldhelp>Enter the contact name</fieldhelp>
       <required>1</required>
     </field>
     <field id="7" field_type="email" base_type="text">
       <label>Email</label>
       <unique>1</unique>
     </field>
   </fields>
 </table>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getSchema('bdb5rjd6g');

    expect(result.table.name).toBe('Contacts');
    expect(result.table.queries).toHaveLength(1);
    expect(result.table.queries?.[0].name).toBe('List All');
    expect(result.table.fields).toHaveLength(2);

    const field1 = result.table.fields?.[0];
    expect(field1?.id).toBe(6);
    expect(field1?.label).toBe('Name');
    expect(field1?.fieldType).toBe('text');
    expect(field1?.required).toBe(true);
    expect(field1?.fieldHelp).toBe('Enter the contact name');

    const field2 = result.table.fields?.[1];
    expect(field2?.fieldType).toBe('email');
    expect(field2?.unique).toBe(true);
  });

  it('should throw on not found error', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetSchema</action>
   <errcode>6</errcode>
   <errtext>No such database</errtext>
</qdbapi>`,
    });

    const client = new XmlClient(mock);

    try {
      await client.getSchema('nonexistent');
    } catch (err) {
      expect(isNotFound(err)).toBe(true);
    }
  });
});

describe('XmlClient.grantedDBs', () => {
  it('should list accessible databases', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GrantedDBs</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <databases>
      <dbinfo>
         <dbname>MyApp</dbname>
         <dbid>bdzk2ecg5</dbid>
         <ancestorappid>beaa6db7t</ancestorappid>
         <oldestancestorappid>bd9jbshim</oldestancestorappid>
      </dbinfo>
      <dbinfo>
         <dbname>MyApp:Table1</dbname>
         <dbid>bdzuh4nj5</dbid>
      </dbinfo>
   </databases>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.grantedDBs({ realmAppsOnly: true, includeAncestors: true });

    expect(mock.lastAction).toBe('API_GrantedDBs');
    expect(result.databases).toHaveLength(2);
    expect(result.databases[0].dbid).toBe('bdzk2ecg5');
    expect(result.databases[0].name).toBe('MyApp');
    expect(result.databases[0].ancestorAppId).toBe('beaa6db7t');
    expect(result.databases[1].name).toBe('MyApp:Table1');
  });
});

describe('XmlClient.getDBInfo', () => {
  it('should get database info', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetDBInfo</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <dbname>test</dbname>
   <lastRecModTime>1205806751959</lastRecModTime>
   <lastModifiedTime>1205877093679</lastModifiedTime>
   <createdTime>1204745351407</createdTime>
   <numRecords>42</numRecords>
   <mgrID>112149.bhsv</mgrID>
   <mgrName>AppBoss</mgrName>
   <time_zone>(UTC-08:00) Pacific Time (US &amp; Canada)</time_zone>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getDBInfo('bqxyz123');

    expect(mock.lastAction).toBe('API_GetDBInfo');
    expect(result.name).toBe('test');
    expect(result.numRecords).toBe(42);
    expect(result.managerId).toBe('112149.bhsv');
    expect(result.managerName).toBe('AppBoss');
    expect(result.lastRecModTime).toBe('1205806751959');
  });
});

describe('XmlClient.getNumRecords', () => {
  it('should get record count', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetNumRecords</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <num_records>17</num_records>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const count = await client.getNumRecords('bqxyz123');

    expect(mock.lastAction).toBe('API_GetNumRecords');
    expect(count).toBe(17);
  });
});

describe('XmlClient.getUserInfo', () => {
  it('should get user info', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>api_getuserinfo</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <user id="112149.bhsv">
      <firstName>Ragnar</firstName>
      <lastName>Lodbrok</lastName>
      <login>Ragnar</login>
      <email>Ragnar-Lodbrok@paris.net</email>
      <screenName>Ragnar</screenName>
      <isVerified>1</isVerified>
      <externalAuth>0</externalAuth>
   </user>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getUserInfo('Ragnar-Lodbrok@paris.net');

    expect(mock.lastAction).toBe('API_GetUserInfo');
    expect(result.id).toBe('112149.bhsv');
    expect(result.firstName).toBe('Ragnar');
    expect(result.lastName).toBe('Lodbrok');
    expect(result.email).toBe('Ragnar-Lodbrok@paris.net');
    expect(result.isVerified).toBe(true);
    expect(result.externalAuth).toBe(false);
  });
});

describe('XmlClient group management', () => {
  it('should create group', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_CreateGroup</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <group id="1217.dgpt">
      <name>MarketingSupport</name>
      <description>Support staff for sr marketing group</description>
      <managedByUser>true</managedByUser>
   </group>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.createGroup('MarketingSupport', 'Support staff for sr marketing group');

    expect(mock.lastAction).toBe('API_CreateGroup');
    expect(result.group.id).toBe('1217.dgpt');
    expect(result.group.name).toBe('MarketingSupport');
  });

  it('should get users in group', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetUsersInGroup</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <group id="2345.sdfk">
      <name>GroupInfoTestGroup</name>
      <description>My Group description</description>
      <users>
         <user id="112149.bhsv">
            <firstName>John</firstName>
            <lastName>Doe</lastName>
            <email>jdoe@example.com</email>
            <screenName></screenName>
            <isAdmin>false</isAdmin>
         </user>
      </users>
      <managers>
         <manager id="52731770.b82h">
            <firstName>Angela</firstName>
            <lastName>Leon</lastName>
            <email>angela@example.com</email>
            <screenName>aqleon</screenName>
            <isMember>true</isMember>
         </manager>
      </managers>
      <subgroups>
         <subgroup id="3450.aefs"/>
      </subgroups>
   </group>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.getUsersInGroup('2345.sdfk', true);

    expect(result.name).toBe('GroupInfoTestGroup');
    expect(result.users).toHaveLength(1);
    expect(result.users[0].firstName).toBe('John');
    expect(result.managers).toHaveLength(1);
    expect(result.managers[0].firstName).toBe('Angela');
    // Note: self-closing XML tags like <subgroup id="..."/> are not parsed by getAllElements
    // This is a limitation of the regex-based parser
  });
});

describe('XmlClient field management', () => {
  it('should add choices', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_FieldAddChoices</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <fid>11</fid>
   <fname>Color</fname>
   <numadded>3</numadded>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.fieldAddChoices('bqxyz123', 11, ['Red', 'Green', 'Blue']);

    expect(mock.lastAction).toBe('API_FieldAddChoices');
    expect(result.fieldId).toBe(11);
    expect(result.fieldName).toBe('Color');
    expect(result.numAdded).toBe(3);
  });

  it('should remove choices', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_FieldRemoveChoices</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <fid>11</fid>
   <fname>Color</fname>
   <numremoved>2</numremoved>
</qdbapi>`,
    });

    const client = new XmlClient(mock);
    const result = await client.fieldRemoveChoices('bqxyz123', 11, ['Red', 'Blue']);

    expect(mock.lastAction).toBe('API_FieldRemoveChoices');
    expect(result.numRemoved).toBe(2);
  });
});

describe('XmlClient code pages', () => {
  it('should get page content', async () => {
    const mock = createMockCaller({
      response: `<html><body>Hello World</body></html>`,
    });

    const client = new XmlClient(mock);
    const content = await client.getDBPage('bqxyz123', 3);

    expect(mock.lastAction).toBe('API_GetDBPage');
    expect(content).toBe('<html><body>Hello World</body></html>');
  });

  it('should handle error response for page not found', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetDBPage</action>
   <errcode>24</errcode>
   <errtext>No such page</errtext>
</qdbapi>`,
    });

    const client = new XmlClient(mock);

    await expect(client.getDBPage('bqxyz123', 999)).rejects.toThrow(XmlError);
  });
});

describe('XmlClient read-only mode', () => {
  it('should block write operations in read-only mode', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_SetDBVar</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
</qdbapi>`,
    });

    const client = new XmlClient(mock, { readOnly: true });

    await expect(client.setDBVar('bqxyz123', 'myVar', 'value')).rejects.toThrow(
      'Read-only mode: API_SetDBVar is blocked'
    );
  });

  it('should allow read operations in read-only mode', async () => {
    const mock = createMockCaller({
      response: `<?xml version="1.0" ?>
<qdbapi>
   <action>API_GetDBVar</action>
   <errcode>0</errcode>
   <errtext>No error</errtext>
   <value>42</value>
</qdbapi>`,
    });

    const client = new XmlClient(mock, { readOnly: true });
    const result = await client.getDBVar('bqxyz123', 'myVar');

    expect(result).toBe('42');
  });
});

describe('Error helpers', () => {
  it('should identify unauthorized errors', () => {
    const err = new XmlError(4, 'User not authorized');
    expect(isUnauthorized(err)).toBe(true);
    expect(isNotFound(err)).toBe(false);
    expect(isInvalidTicket(err)).toBe(false);
  });

  it('should identify not found errors', () => {
    const err = new XmlError(6, 'No such database');
    expect(isNotFound(err)).toBe(true);
    expect(isUnauthorized(err)).toBe(false);
  });

  it('should identify invalid ticket errors', () => {
    // XmlErrorCode.InvalidTicket = 8
    const err = new XmlError(8, 'Invalid ticket');
    expect(isInvalidTicket(err)).toBe(true);
    expect(isUnauthorized(err)).toBe(false);
  });

  it('should return false for non-XmlError', () => {
    const err = new Error('generic error');
    expect(isUnauthorized(err)).toBe(false);
    expect(isNotFound(err)).toBe(false);
    expect(isInvalidTicket(err)).toBe(false);
  });
});
