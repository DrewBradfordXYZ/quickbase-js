// The code in README.md and guides/*.md comes from this file, which
// `npm run typecheck` checks against the SDK's types. Change them together.
//
// The line marked "cast" reads a record keyed by alias: requests accept
// aliases, but the generated response types describe field IDs.

import {
  createClient,
  createXmlClient,
  ReadOnlyError,
  RateLimitError,
  NotFoundError,
  QuickbaseError,
  XmlError,
  isXmlUnauthorized,
} from '../src/index.js';
import type { Schema } from '../src/index.js';

declare const appId: string;
declare const userId: string;
declare const roleId: number;

// README: the opening line
export async function hero() {
  const qb = createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'token' } });
  const projects = await qb.runQuery({ from: 'bqtable1', where: "{7.EX.'Active'}" }).all();
  console.log(projects.data?.length);
}

// README: quick start
export async function quickStart() {
  const qb = createClient({
    realm: 'mycompany', // mycompany.quickbase.com
    auth: { type: 'user-token', userToken: process.env.QB_USER_TOKEN! },
  });

  const app = await qb.getApp({ appId: 'bpqe82s1' });
  console.log(app.name);

  const result = await qb.runQuery({
    from: 'bqtable1',
    select: [3, 6, 7],
    where: "{7.EX.'Active'}",
  }).all(); // every page
  for (const record of result.data ?? []) {
    console.log(record['6']?.value);
  }

  await qb.upsert({
    to: 'bqtable1',
    data: [{ '6': 'New project', '7': 'Active' }], // plain values are wrapped for you
  });
}

// README: code pages
export function codePage() {
  const qb = createClient({
    realm: window.location.hostname.split('.')[0]!,
    auth: { type: 'temp-token' },
  });
  return qb.getApp({ appId: 'bpqe82s1' });
}

// README: read an app's tables and fields
export async function readSchema() {
  const qb = createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'token' } });

  const tables = await qb.getAppTables({ appId: 'bpqe82s1' });
  console.log(tables.map((t) => `${t.id} ${t.name}`));

  const fields = await qb.getFields({ tableId: 'bqtable1' });
  console.log(fields.map((f) => `${f.id} ${f.label} (${f.fieldType})`));
}

// guides/queries.md: pagination
export async function pagination() {
  const qb = createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'token' } });

  const page = await qb.runQuery({ from: 'bqtable1' }); // one page
  console.log(page.data?.length, page.metadata?.totalRecords);

  const all = await qb.runQuery({ from: 'bqtable1' }).all();
  const first500 = await qb.runQuery({ from: 'bqtable1' }).paginate({ limit: 500 });
  const single = await qb.runQuery({ from: 'bqtable1' }).noPaginate();
  console.log(all.data?.length, first500.data?.length, single.data?.length);

  const reportRows = await qb.runReport({ reportId: '7', tableId: 'bqtable1' }).all();
  console.log(reportRows.data?.length);

  const auto = createClient({
    realm: 'mycompany',
    auth: { type: 'user-token', userToken: 'token' },
    autoPaginate: true, // a plain await fetches every page
  });
  await auto.runQuery({ from: 'bqtable1' });
}

// guides/queries.md: records
export async function records() {
  const qb = createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'token' } });

  await qb.runQuery({
    from: 'bqtable1',
    select: [3, 6, 7],
    where: '{6.GT.100}',
    sortBy: [{ fieldId: 3, order: 'ASC' }],
    options: { top: 100, skip: 0 },
  });

  const result = await qb.upsert({
    to: 'bqtable1',
    mergeFieldId: 9,
    data: [{ '9': { value: 'EXT-001' }, '6': { value: 'Alpha' } }],
    fieldsToReturn: [6],
  });
  console.log(result.metadata?.createdRecordIds, result.metadata?.updatedRecordIds);

  await qb.deleteRecords({ from: 'bqtable1', where: '{3.EX.123}' });
  await qb.getFields({ tableId: 'bqtable1' });
  await qb.updateApp({ appId: 'bpqe82s1' }, { name: 'Renamed' });
}

// README: field names instead of IDs
export async function readmeFieldNames() {
  const qb = createClient({
    realm: 'mycompany',
    auth: { type: 'user-token', userToken: 'token' },
    schema: { tables: { projects: { id: 'bqw3ryzab', fields: { id: 3, name: 6, status: 7 } } } },
  });

  const result = await qb.runQuery({
    from: 'projects',
    select: ['name', 'status'],
    where: "{'status'.EX.'Active'}",
  });
  const first = result.data?.[0] as Record<string, unknown> | undefined; // TypeScript: keyed by name
  console.log(first?.name, first?.status);

  await qb.upsert({ to: 'projects', data: [{ name: 'Alpha', status: 'Active' }] });
}

// guides/schema-aliases.md
export async function schemaAliases() {
  const schema: Schema = {
    tables: {
      projects: {
        id: 'bqw3ryzab',
        fields: { id: 3, name: 6, status: 7, dueDate: 12 },
      },
    },
  };
  const qb = createClient({
    realm: 'mycompany',
    auth: { type: 'user-token', userToken: 'token' },
    schema,
  });

  const result = await qb.runQuery({
    from: 'projects',
    select: ['name', 'status'],
    where: "{'status'.EX.'Active'}",
    sortBy: [{ fieldId: 'dueDate', order: 'ASC' }],
  });
  const first = result.data?.[0] as Record<string, unknown> | undefined; // cast: keyed by alias, unwrapped
  console.log(first?.name, first?.status);

  await qb.upsert({ to: 'projects', data: [{ name: 'Alpha', status: 'Active' }] });
}

// guides/authentication.md
export function authentication() {
  createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'b9f3pk_xxx' } });
  createClient({ realm: 'mycompany', auth: { type: 'temp-token' } });
  createClient({ realm: 'mycompany', auth: { type: 'sso', samlToken: 'base64url-saml-assertion' } });
  createClient({
    realm: 'mycompany',
    auth: {
      type: 'ticket',
      username: 'user@example.com',
      password: 'from-a-login-form',
      hours: 24,
      persist: 'sessionStorage',
      onExpired: () => {
        window.location.href = '/login';
      },
    },
    appToken: 'app-token', // XML API calls only
  });
}

// guides/reliability.md
export function reliability() {
  createClient({
    realm: 'mycompany',
    auth: { type: 'user-token', userToken: 'token' },
    timeout: 30000,
    rateLimit: {
      proactiveThrottle: { enabled: true, requestsPer10Seconds: 100 },
      retry: { maxAttempts: 5, initialDelayMs: 1000, maxDelayMs: 30000, multiplier: 2 },
      onRateLimit: (info) => {
        console.log(`rate limited on ${info.requestUrl}; retry after ${info.retryAfter}s (ray ${info.qbApiRay})`);
      },
    },
  });
}

// README: errors
export async function errors() {
  const qb = createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'token' }, readOnly: true });
  try {
    await qb.getApp({ appId: 'bpqe82s1' });
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`rate limited; retry after ${error.retryAfter}s`);
    } else if (error instanceof NotFoundError) {
      console.log('no such app');
    } else if (error instanceof ReadOnlyError) {
      console.log(`write blocked: ${error.method} ${error.path}`);
    } else if (error instanceof QuickbaseError) {
      console.log(`QuickBase error ${error.statusCode}: ${error.message}`);
    }
  }
}

// README: solutions and files
export async function solutionsAndFiles() {
  const qb = createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'token' } });
  const qbl = await qb.exportSolution({ solutionId: 'solution-id' }); // QBL (YAML) text
  await qb.updateSolution({ solutionId: 'solution-id' }, qbl);
  await qb.createSolution(qbl);
  const file = await qb.downloadFile({ tableId: 'bqtable1', recordId: 12, fieldId: 8, versionNumber: 0 });
  console.log(file.length); // base64 file content
}

// README: raw requests
export async function rawRequest() {
  const qb = createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'token' } });
  const result = await qb.request<{ id: string }>({ method: 'GET', path: '/apps/bpqe82s1' });
  console.log(result.id);
}

// guides/xml-api.md
export async function xmlApi() {
  const qb = createClient({ realm: 'mycompany', auth: { type: 'user-token', userToken: 'token' } });
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
}

// guides/xml-api.md: aliases
export async function xmlAliases() {
  const qb = createClient({
    realm: 'mycompany',
    auth: { type: 'user-token', userToken: 'token' },
    schema: { tables: { projects: { id: 'bqprojects123', fields: { id: 3, name: 6, status: 7 } } } },
  });
  const xml = createXmlClient(qb);

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
}
