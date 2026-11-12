# quickbase-js

[![npm](https://img.shields.io/npm/v/quickbase-js)](https://www.npmjs.com/package/quickbase-js)
[![CI](https://github.com/DrewBradfordXYZ/quickbase-js/actions/workflows/ci.yml/badge.svg)](https://github.com/DrewBradfordXYZ/quickbase-js/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/quickbase-js)](LICENSE)

The QuickBase API for TypeScript and JavaScript, in Node.js, the browser and QuickBase code pages.

```typescript
const projects = await qb.runQuery({ from: 'bqtable1', where: "{7.EX.'Active'}" }).all();
```

- **Every endpoint** in QuickBase's API as a typed method, generated from QuickBase's published spec and checked against live responses.
- **Every page of results** with `.all()`, so you never write a `skip` loop.
- **Field names instead of IDs**: `select: ['name', 'status']`, with a generator that writes the names from your app.
- **No token in code pages**: the client signs in with the user's QuickBase session and renews its tokens.
- **Rate limits handled**: 429s and server errors are retried with backoff, and the client can pace itself to stay under the limit.
- **The XML API too**, for roles, groups, code pages, app variables and CSV imports.
- **No dependencies**, a read-only mode for tools that must never write, and typed errors.

```bash
npm install quickbase-js
```

## Quick start

Create a [user token](https://help.quickbase.com/docs/user-tokens) in QuickBase, then:

```typescript
import { createClient } from 'quickbase-js';

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
```

## In a code page

Load the browser bundle and use temporary-token auth. Calls run as the signed-in user, with that user's permissions, and there is no token in your page.

```html
<script src="https://cdn.jsdelivr.net/npm/quickbase-js@3/dist/quickbase.min.js"></script>
<script>
  const qb = QuickBase.createClient({
    realm: window.location.hostname.split('.')[0],
    auth: { type: 'temp-token' },
  });
  qb.getApp({ appId: 'bpqe82s1' }).then((app) => console.log(app.name));
</script>
```

As a module: `import { createClient } from 'https://cdn.jsdelivr.net/npm/quickbase-js@3/dist/quickbase.esm.js'`.

[`examples/codepages`](examples/codepages) has a complete, read-only code page in plain JavaScript, Preact, React, Vue and Angular: a live feed of what changed across every table in the app. Paste one into a new code page; there's nothing to configure.

## Common tasks

### Get every record from a table

```typescript
const all = await qb.runQuery({ from: 'bqtable1' }).all();
const first500 = await qb.runQuery({ from: 'bqtable1' }).paginate({ limit: 500 });
const page = await qb.runQuery({ from: 'bqtable1' }); // one page
```

QuickBase returns a page at a time. `runQuery`, `runReport`, `getUsers` and the other paginated methods return one page when awaited, and follow the pages with `.all()` or `.paginate()`. Set `autoPaginate: true` on the client to make a plain `await` fetch them all.

### Filter and sort

```typescript
await qb.runQuery({
  from: 'bqtable1',
  select: [3, 6, 7],
  where: '{6.GT.100}',
  sortBy: [{ fieldId: 3, order: 'ASC' }],
  options: { top: 100, skip: 0 },
});
```

`where` uses QuickBase's [query syntax](https://help.quickbase.com/docs/components-of-a-query): `{field.OPERATOR.'value'}`, joined with `AND` and `OR`.

### Run a report

```typescript
const reportRows = await qb.runReport({ reportId: '7', tableId: 'bqtable1' }).all();
```

### Add or update records

`upsert` adds records, or updates the one whose merge field matches (the key field, usually Record ID#, when you don't name one):

```typescript
const result = await qb.upsert({
  to: 'bqtable1',
  mergeFieldId: 9,
  data: [{ '9': { value: 'EXT-001' }, '6': { value: 'Alpha' } }],
  fieldsToReturn: [6],
});
console.log(result.metadata?.createdRecordIds, result.metadata?.updatedRecordIds);
```

### Delete records

```typescript
await qb.deleteRecords({ from: 'bqtable1', where: '{3.EX.123}' });
```

### Use field names instead of IDs

Give the client a schema and use your names anywhere an ID goes. Records come back keyed by name, with plain values:

```typescript
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
```

Generate the schema from your app instead of writing it, and regenerate with `--merge` when the app changes (your renamed aliases are kept):

```bash
npx quickbase-js schema -r mycompany -a bpqe82s1 -t "$QB_USER_TOKEN" -o schema.ts
```

A misspelled name throws with a suggestion (`Did you mean 'status'?`). Results are typed by field ID, which is why TypeScript needs the cast; the [schema guide](guides/schema-aliases.md) has the details.

### Read an app's tables and fields

```typescript
const tables = await qb.getAppTables({ appId: 'bpqe82s1' });
console.log(tables.map((t) => `${t.id} ${t.name}`));

const fields = await qb.getFields({ tableId: 'bqtable1' });
console.log(fields.map((f) => `${f.id} ${f.label} (${f.fieldType})`));
```

### Export and update a solution, download a file

Solutions are QBL (YAML) and files are raw content, so these take and return text:

```typescript
const qbl = await qb.exportSolution({ solutionId: 'solution-id' });
await qb.updateSolution({ solutionId: 'solution-id' }, qbl);
const file = await qb.downloadFile({ tableId: 'bqtable1', recordId: 12, fieldId: 8, versionNumber: 0 }); // base64
```

### Manage roles, groups and code pages

The JSON API doesn't cover these, so `createXmlClient(qb)` calls the XML API with the same authentication, retries, read-only mode and schema:

```typescript
import { createXmlClient } from 'quickbase-js';

const xml = createXmlClient(qb);
const roles = await xml.getRoleInfo(appId);
for (const role of roles.roles) {
  console.log(role.name, role.access.description);
}
```

Every method is in the [XML API guide](guides/xml-api.md).

### Call any endpoint directly

```typescript
const result = await qb.request<{ id: string }>({ method: 'GET', path: '/apps/bpqe82s1' });
```

`request` uses the client's authentication, retries and throttling.

## Authentication

| `auth.type` | Use it for |
|---|---|
| `'user-token'` | Servers and scripts |
| `'temp-token'` | Code pages and other browser code inside QuickBase |
| `'ticket'` | A user signing in with their QuickBase email and password |
| `'sso'` | A user signed in through your identity provider (SAML) |

Details are in the [authentication guide](guides/authentication.md).

## Rate limits and retries

QuickBase allows 100 requests per 10 seconds per user token. The client retries 429s with exponential backoff, honoring `Retry-After`, and retries timeouts and server errors for reads; a write that may have been applied isn't sent twice. It can throttle itself so it never hits the limit:

```typescript
createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  rateLimit: {
    proactiveThrottle: { enabled: true, requestsPer10Seconds: 100 },
    retry: { maxAttempts: 5 },
  },
});
```

Timeouts, backoff settings, a rate-limit callback, cancelling with `withSignal`, and `throwOnLineErrors` are in the [reliability guide](guides/reliability.md).

## Errors

Every error extends `QuickbaseError`, with a class for each kind of failure:

```typescript
import { RateLimitError, NotFoundError, ReadOnlyError, QuickbaseError } from 'quickbase-js';

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
```

| Class | Status |
|---|---|
| `ValidationError` | 400 |
| `AuthenticationError` | 401 |
| `AuthorizationError` | 403 |
| `NotFoundError` | 404 |
| `RateLimitError` | 429 |
| `ServerError` | 5xx |
| `ReadOnlyError` | a write blocked by `readOnly: true` |
| `TimeoutError` | no answer within `timeout` |
| `NetworkError` | no answer at all (DNS, connection) |
| `LineErrorsError` | an upsert's rejected values, with `throwOnLineErrors: true` |

The XML API adds `QuickbaseTicketError`, `QuickbaseAppTokenError` and `QuickbaseXmlError`.

## Other options

- **`readOnly: true`** refuses every write before it is sent, in both APIs. Reads sent as POST (`runQuery`, `runReport`, `audit`) still work.
- **Dates**: in query and report results, Date fields are `QuickbaseDate` and Date/Time fields `QuickbaseDateTime`, both `Date`s that show the stored day in any time zone and write back as their field expects. Upserting a plain `Date` throws: say which kind it is. See [dates](guides/dates.md); `convertDates: false` keeps the strings.
- **Requirements**: Node.js 18 or later, or any modern browser. The package is ES modules; the browser bundle also defines a `QuickBase` global.

## Documentation

- Guides: [queries and pagination](guides/queries.md), [schema aliases](guides/schema-aliases.md), [authentication](guides/authentication.md), [rate limits and retries](guides/reliability.md), [dates](guides/dates.md), [the XML API](guides/xml-api.md), [migrating from v1](guides/migration.md)
- [API reference](https://drewbradfordxyz.github.io/quickbase-js/): every method, with QuickBase's descriptions
- [CHANGELOG](CHANGELOG.md)

## Development

```bash
git clone --recurse-submodules https://github.com/DrewBradfordXYZ/quickbase-js.git
npm install
npm test           # unit tests
npm run typecheck  # the library, and the docs' examples
npm run spec:build # regenerate the types from the pinned spec in spec/
```

`spec/` is a submodule of [quickbase-spec](https://github.com/DrewBradfordXYZ/quickbase-spec), and CI fails when the generated types don't match it. The code in this README and `guides/` comes from `examples/docs.ts`, which `npm run typecheck` checks; change them together.

## Related

- [quickbase-go](https://github.com/DrewBradfordXYZ/quickbase-go): the Go SDK, from the same spec

## License

MIT
