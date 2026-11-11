# QuickBase JS SDK

A TypeScript client for the [QuickBase JSON API](https://developer.quickbase.com/), for Node.js and the browser (including QuickBase code pages), with the legacy XML API for what JSON lacks.

- **Every operation** as a typed method, generated from a spec checked against live responses
- **Pagination** with `.all()` and `.paginate()`, and readable **schema aliases** instead of IDs
- **Temporary tokens in code pages**, fetched and refreshed for you from the user's session
- **Retries and throttling** for QuickBase's rate limits
- **Read-only mode** for tools that must never write

**[API reference →](https://drewbradfordxyz.github.io/quickbase-js/)**

```bash
npm install quickbase-js
```

## Quick start

```typescript
import { createClient } from 'quickbase-js';

const qb = createClient({
  realm: 'mycompany',
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

In the browser, temporary-token auth uses the signed-in user's QuickBase session: no token in your code, and every call has that user's permissions.

```html
<script src="https://cdn.jsdelivr.net/npm/quickbase-js@2/dist/quickbase.min.js"></script>
<script>
  const qb = QuickBase.createClient({
    realm: window.location.hostname.split('.')[0],
    auth: { type: 'temp-token' },
  });
  qb.getApp({ appId: 'bpqe82s1' }).then((app) => console.log(app.name));
</script>
```

Or as a module: `import { createClient } from 'https://cdn.jsdelivr.net/npm/quickbase-js@2/dist/quickbase.esm.js'`.

## Typed methods for every operation

Each QuickBase operation is a method on the client, typed from [quickbase-spec](https://github.com/DrewBradfordXYZ/quickbase-spec), including properties QuickBase returns but doesn't document. Path and query parameters come first, then the body:

```typescript
await qb.getFields({ tableId: 'bqtable1' });
await qb.runQuery({ from: 'bqtable1', select: [3, 6], sortBy: [{ fieldId: 3, order: 'ASC' }] });
await qb.deleteRecords({ from: 'bqtable1', where: '{3.EX.123}' });
await qb.updateApp({ appId: 'bpqe82s1' }, { name: 'Renamed' });
```

All of them, with QuickBase's descriptions: the [API reference](https://drewbradfordxyz.github.io/quickbase-js/interfaces/QuickbaseAPI.html).

## Pagination

QuickBase returns a page of records at a time. Paginated methods (`runQuery`, `runReport`, `getUsers`, ...) return one page when awaited, or follow the pages:

```typescript
const page = await qb.runQuery({ from: 'bqtable1' });                          // one page
const all = await qb.runQuery({ from: 'bqtable1' }).all();                     // every page
const first500 = await qb.runQuery({ from: 'bqtable1' }).paginate({ limit: 500 });
```

`autoPaginate: true` makes a plain `await` fetch every page. See [guides/queries.md](guides/queries.md).

## Schema aliases

Give the client names for your tables and fields, and use them instead of IDs. Requests are translated to IDs; responses come back keyed by name, with values unwrapped.

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
console.log(result.data?.[0]?.name);
```

Requests accept aliases in TypeScript too. Results are typed by field ID, so read an aliased record with a cast. See [guides/schema-aliases.md](guides/schema-aliases.md), which also covers the schema generator (`npx quickbase-js schema`).

## Authentication

| `auth.type` | Use it for |
|---|---|
| `'user-token'` | Servers and scripts |
| `'temp-token'` | Code pages and other browser code inside QuickBase |
| `'ticket'` | A user signing in with their QuickBase email and password |
| `'sso'` | A user signed in through your identity provider (SAML) |

Details: [guides/authentication.md](guides/authentication.md).

## Rate limits and retries

QuickBase allows 100 requests per 10 seconds per user token. The client retries 429s and server errors with exponential backoff (honoring `Retry-After`) and can throttle itself so it never hits the limit:

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

See [guides/reliability.md](guides/reliability.md).

## Read-only mode

`readOnly: true` makes the client refuse every write before it is sent, for the JSON API and the XML client made from it. Reads that use POST, like `runQuery`, `runReport` and `audit`, still work. A blocked call throws `ReadOnlyError`.

## Errors

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

The classes are `RateLimitError` (429), `AuthenticationError` (401), `AuthorizationError` (403), `NotFoundError` (404), `ValidationError` (400), `ServerError` (5xx) and `ReadOnlyError`, all extending `QuickbaseError`; the XML API adds `QuickbaseTicketError`, `QuickbaseAppTokenError` and `QuickbaseXmlError`.

## Solutions and files

Solutions are QBL (YAML) and file downloads are raw content, so these methods take and return text:

```typescript
const qbl = await qb.exportSolution({ solutionId: 'solution-id' });
await qb.updateSolution({ solutionId: 'solution-id' }, qbl);
const file = await qb.downloadFile({ tableId: 'bqtable1', recordId: 12, fieldId: 8, versionNumber: 0 }); // base64
```

## Dates

ISO date strings in responses become `Date` objects. The generated types say `string`, because QuickBase's spec marks few of its date fields as dates; set `convertDates: false` if you want values to match the types exactly.

## Raw requests

`qb.request<T>({ method, path, body, query })` calls any endpoint with the client's authentication, retries and throttling.

## The legacy XML API

`createXmlClient(qb)` reaches what the JSON API doesn't: roles, groups, code pages, app variables, webhooks, CSV imports. It shares the client's authentication, retries, read-only mode and schema.

```typescript
import { createXmlClient } from 'quickbase-js';

const xml = createXmlClient(qb);
const roles = await xml.getRoleInfo(appId);
for (const role of roles.roles) {
  console.log(role.name, role.access.description);
}
```

Every method: [guides/xml-api.md](guides/xml-api.md).

## Guides

- [Queries, pagination and records](guides/queries.md)
- [Schema aliases](guides/schema-aliases.md)
- [Authentication](guides/authentication.md)
- [Rate limits and retries](guides/reliability.md)
- [The XML API](guides/xml-api.md)
- [Migrating from v1](guides/migration.md)
- [API reference](https://drewbradfordxyz.github.io/quickbase-js/) and [CHANGELOG](CHANGELOG.md)

## Development

```bash
git clone --recurse-submodules https://github.com/DrewBradfordXYZ/quickbase-js.git
npm install
npm test           # unit tests
npm run typecheck  # the library, and the docs' examples
npm run spec:build # regenerate the types from the pinned spec in spec/
```

`spec/` is a submodule of [quickbase-spec](https://github.com/DrewBradfordXYZ/quickbase-spec). CI requires the generated types to match it. The code in this README and `guides/` comes from `examples/docs.ts`, which `npm run typecheck` checks (aliased examples there carry the casts TypeScript needs).

## Related

- [quickbase-go](https://github.com/DrewBradfordXYZ/quickbase-go): the Go SDK, from the same spec

## License

MIT
