# The legacy XML API

`createXmlClient(qb)` reaches what the JSON API doesn't: roles, groups, code pages, app variables, webhooks, CSV imports and HTML generation. It shares the client's authentication, retries and throttling, and inherits its read-only mode and schema.

> QuickBase calls the XML API legacy and may retire it. Prefer a JSON method where one exists.

```typescript
import { createClient, createXmlClient, XmlError, isXmlUnauthorized } from 'quickbase-js';

const xml = createXmlClient(qb);

const roles = await xml.getRoleInfo(appId);
for (const role of roles.roles) {
  console.log(role.name, role.access.description);
}
const users = await xml.userRoles(appId);
for (const user of users.users) {
  console.log(user.name, user.roles.map((r) => r.name).join(', '));
}

try {
  await xml.addUserToRole(appId, userId, roleId);
} catch (error) {
  if (error instanceof XmlError) {
    console.log(`XML error ${error.code}: ${error.text}`, isXmlUnauthorized(error));
  }
}
```

`isXmlUnauthorized`, `isXmlNotFound` and `isXmlInvalidTicket` test for the common error codes. Options: `createXmlClient(qb, { appToken, readOnly })`.

## Schema aliases

With a schema on the client, XML methods take table and field aliases, and results are keyed by them:

```typescript
const xml = createXmlClient(qb); // qb has a schema with "projects"

await xml.getNumRecords('projects');
await xml.fieldAddChoices('projects', 'status', ['Active', 'Inactive']);
await xml.importFromCSV('projects', { recordsCsv: 'Project A,Active', clist: ['name', 'status'], mergeFieldId: 'id' });

const record = await xml.getRecordInfo('projects', 123);
console.log(record.fields.name?.value);
const schema = await xml.getSchema('projects');
console.log(schema.table.fields?.name?.label, schema.table.childTables?.tasks?.dbid);
const dbs = await xml.grantedDBs();
console.log(dbs.databases.projects?.name);
const dtm = await xml.getAppDTMInfo('projects');
console.log(dtm.tables.projects?.lastModifiedTime);
```

Responses keyed by alias:

| Method | Keyed Properties |
|--------|-----------------|
| `getRecordInfo` / `getRecordInfoByKey` | `fields.{alias}` |
| `getSchema` | `table.fields.{alias}`, `table.childTables.{alias}` |
| `grantedDBs` / `grantedDBsForGroup` | `databases.{alias}` |
| `getAppDTMInfo` | `tables.{alias}` |
| `fieldAddChoices` / `fieldRemoveChoices` | `fieldAlias` property |
| `findDBByName` | `alias` property |

Without a schema they are keyed by ID.

## Methods

**App Discovery:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `grantedDBs(opts?)` | API_GrantedDBs | List all apps/tables user can access |
| `findDBByName(name, parentsOnly?)` | API_FindDBByName | Find an app by name |
| `getDBInfo(dbid)` | API_GetDBInfo | Get app/table metadata (record count, manager, timestamps) |
| `getNumRecords(tableId)` | API_GetNumRecords | Get total record count for a table |

**Role Management:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `getRoleInfo(appId)` | API_GetRoleInfo | Get all roles defined in an application |
| `userRoles(appId)` | API_UserRoles | Get all users and their role assignments |
| `getUserRole(appId, userId, includeGroups?)` | API_GetUserRole | Get roles for a specific user |
| `addUserToRole(appId, userId, roleId)` | API_AddUserToRole | Assign a user to a role |
| `removeUserFromRole(appId, userId, roleId)` | API_RemoveUserFromRole | Remove a user from a role |
| `changeUserRole(appId, userId, currentRole, newRole)` | API_ChangeUserRole | Change a user's role |

**User Management:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `getUserInfo(email)` | API_GetUserInfo | Get user info by email address |
| `provisionUser(appId, email, opts?)` | API_ProvisionUser | Create a new unregistered user |
| `sendInvitation(appId, userId, userText?)` | API_SendInvitation | Send invitation email to a user |
| `changeManager(appId, newManagerEmail)` | API_ChangeManager | Change the app manager |
| `changeRecordOwner(tableId, recordId, newOwner)` | API_ChangeRecordOwner | Change record owner |

**Group Management:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `createGroup(name, opts?)` | API_CreateGroup | Create a new group |
| `deleteGroup(groupId)` | API_DeleteGroup | Delete a group |
| `copyGroup(groupId, name, opts?)` | API_CopyGroup | Copy a group |
| `changeGroupInfo(groupId, opts)` | API_ChangeGroupInfo | Update group name/description |
| `getUsersInGroup(groupId, includeManagers?)` | API_GetUsersInGroup | Get users and managers in a group |
| `addUserToGroup(groupId, userId, allowAdmin?)` | API_AddUserToGroup | Add a user to a group |
| `removeUserFromGroup(groupId, userId)` | API_RemoveUserFromGroup | Remove a user from a group |
| `getGroupRole(appId, groupId)` | API_GetGroupRole | Get roles assigned to a group |
| `addGroupToRole(appId, groupId, roleId)` | API_AddGroupToRole | Assign a group to a role |
| `removeGroupFromRole(appId, groupId, roleId, allRoles?)` | API_RemoveGroupFromRole | Remove a group from a role |
| `grantedGroups(userId?, adminOnly?)` | API_GrantedGroups | Get groups a user belongs to |
| `grantedDBsForGroup(groupId)` | API_GrantedDBsForGroup | Get apps a group can access |

**App Metadata:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `getAppDTMInfo(appId)` | API_GetAppDTMInfo | Get modification timestamps |
| `getAncestorInfo(appId)` | API_GetAncestorInfo | Get app copy/template lineage info |

**Application Variables:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `getDBVar(appId, varName)` | API_GetDBVar | Get an application variable value |
| `setDBVar(appId, varName, value)` | API_SetDBVar | Set an application variable value |

**Code Pages:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `getDBPage(appId, pageIdOrName)` | API_GetDBPage | Get stored code page content |
| `addReplaceDBPage(appId, opts)` | API_AddReplaceDBPage | Create or update a code page |

**Field Management:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `fieldAddChoices(tableId, fieldId, choices)` | API_FieldAddChoices | Add choices to a multiple-choice field |
| `fieldRemoveChoices(tableId, fieldId, choices)` | API_FieldRemoveChoices | Remove choices from a field |
| `setKeyField(tableId, fieldId)` | API_SetKeyField | Set the key field for a table |

**Schema Information:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `getSchema(dbid)` | API_GetSchema | Get comprehensive app/table metadata |

**Record Information:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `doQueryCount(tableId, query?)` | API_DoQueryCount | Get count of matching records (no data fetch) |
| `getRecordInfo(tableId, recordId)` | API_GetRecordInfo | Get record with field metadata |
| `getRecordInfoByKey(tableId, keyValue)` | API_GetRecordInfo | Get record by key field value |

**Record Operations:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `copyMasterDetail(tableId, opts)` | API_CopyMasterDetail | Copy a master record with its detail records |
| `importFromCSV(tableId, opts)` | API_ImportFromCSV | Bulk import/update records from CSV data |
| `runImport(tableId, importId)` | API_RunImport | Execute a saved import definition |

**Webhooks:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `webhooksCreate(tableId, opts)` | API_Webhooks_Create | Create a webhook |
| `webhooksEdit(tableId, webhookId, opts)` | API_Webhooks_Edit | Edit a webhook |
| `webhooksDelete(tableId, webhookId)` | API_Webhooks_Delete | Delete a webhook |
| `webhooksActivate(tableId, webhookId)` | API_Webhooks_Activate | Activate a webhook |
| `webhooksDeactivate(tableId, webhookId)` | API_Webhooks_Deactivate | Deactivate a webhook |
| `webhooksCopy(tableId, webhookId, name?)` | API_Webhooks_Copy | Copy a webhook |

**HTML Generation:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `genAddRecordForm(tableId, fields?)` | API_GenAddRecordForm | Generate HTML form for adding a record |
| `genResultsTable(tableId, opts?)` | API_GenResultsTable | Generate HTML/JS/CSV table of query results |
| `getRecordAsHTML(tableId, opts)` | API_GetRecordAsHTML | Get a record rendered as HTML |

**Authentication:**

| Method | XML Action | Description |
|--------|------------|-------------|
| `signOut()` | API_SignOut | Clear ticket cookie (browser-focused) |
