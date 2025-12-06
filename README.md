# QuickBase JS SDK v2

A TypeScript/JavaScript client for the QuickBase JSON RESTful API.

## Features

- **Typed API Methods** - Full TypeScript support with auto-generated types from OpenAPI spec
- **Multiple Auth Methods** - User token, temporary token, SSO, and ticket authentication
- **Schema Aliases** - Use readable names for tables and fields instead of IDs
- **Fluent Pagination** - Chain `.all()`, `.paginate()`, or `.noPaginate()` on paginated endpoints
- **Date Conversion** - Automatic conversion of ISO date strings to JavaScript Date objects
- **Rate Limit Handling** - Automatic retry with exponential backoff on 429 errors
- **Proactive Throttling** - Optional client-side request throttling
- **Tree-Shakeable** - Static method generation for optimal bundle size

## API Reference

**[View Full API Documentation →](https://drewbradfordxyz.github.io/quickbase-js/)**

The SDK provides typed methods for all 59 QuickBase API endpoints including Apps, Tables, Fields, Records, Reports, Users, and more. Each method includes JSDoc documentation with links to the official QuickBase API docs.

## Installation

### npm / Node.js

```bash
npm install quickbase-js
```

### Browser / CDN (QuickBase Code Pages)

For QuickBase Code Pages, use temp-token authentication which automatically leverages the user's browser session:

```html
<script src="https://cdn.jsdelivr.net/npm/quickbase-js@2/dist/quickbase.min.js"></script>
<script>
  // Realm can be auto-detected from the current URL
  const realm = window.location.hostname.split('.')[0];

  const qb = QuickBase.createClient({
    realm: realm,
    auth: { type: 'temp-token' },
  });

  qb.getApp({ appId: 'bpqe82s1' }).then(app => {
    console.log(app.name);
  });
</script>
```

Or with ES modules:

```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/quickbase-js@2/dist/quickbase.esm.js';

  const qb = createClient({
    realm: 'mycompany',
    auth: { type: 'temp-token' },
  });

  const app = await qb.getApp({ appId: 'bpqe82s1' });
  console.log(app.name);
</script>
```

## Quick Start

```typescript
import { createClient } from 'quickbase-js';

const qb = createClient({
  realm: 'mycompany',
  auth: {
    type: 'user-token',
    userToken: 'your-user-token',
  },
});

// Use typed API methods
const app = await qb.getApp({ appId: 'bpqe82s1' });
console.log(app.name);

// Query records
const records = await qb.runQuery({
  from: 'bpqe82s1',
  select: [3, 6, 7],
  where: "{6.EX.'Active'}",
});
console.log(records.data);
```

## Authentication

### User Token (Recommended for Server-Side)

```typescript
const qb = createClient({
  realm: 'mycompany',
  auth: {
    type: 'user-token',
    userToken: 'your-user-token',
  },
});
```

### Temporary Token (Recommended for Browser/Code Pages)

Temporary tokens are automatically fetched and cached per database. Tokens are refreshed proactively before expiration (default: 4m 50s TTL for 5-minute tokens). The SDK also handles unexpected 401 errors as a fallback.

```typescript
// In QuickBase Code Pages - uses browser session for authentication
const qb = createClient({
  realm: 'mycompany',
  auth: {
    type: 'temp-token',
  },
});
```

**Auto dbid extraction:** The SDK automatically extracts the database ID for temp token authentication from your request parameters:

- `body.from` (runQuery, deleteRecords)
- `body.to` (upsert)
- `query.tableId` (getFields, etc.)
- `query.appId` (getAppTables, etc.)
- Path segments `/tables/{tableId}` and `/apps/{appId}`

This means you don't need to manually specify the dbid - just make API calls and the SDK handles token management automatically.

### SSO Token

```typescript
const qb = createClient({
  realm: 'mycompany',
  auth: {
    type: 'sso',
    samlToken: 'your-saml-token',
  },
});
```

### Ticket Auth (Username/Password)

Ticket authentication lets users log in with their QuickBase email and password. Unlike user tokens, tickets properly attribute record changes (`createdBy`/`modifiedBy`) to the authenticated user. Credentials should come from user input (e.g., a login form), not hardcoded.

```typescript
// Create client after user submits login form
function handleLogin(formData: { username: string; password: string }) {
  const qb = createClient({
    realm: 'mycompany',
    auth: {
      type: 'ticket',
      username: formData.username,
      password: formData.password,
      hours: 24,                      // Optional: validity (default: 12h, max: ~6 months)
      persist: 'sessionStorage',      // Optional: survive page refresh
      onExpired: () => {              // Optional: called when ticket expires
        window.location.href = '/login';
      },
    },
  });
  return qb;
}
```

**Key behaviors:**
- Authentication happens lazily on the first API call
- Password is discarded from memory immediately after authentication
- Use `persist` to survive page refreshes (`'sessionStorage'` or `'localStorage'`)
- Use `onExpired` to handle session expiration (e.g., redirect to login)

## Pagination

Paginated endpoints (`runQuery`, `runReport`, `getUsers`, etc.) return a `PaginatedRequest` that supports fluent pagination methods.

### Default Behavior (Single Page)

```typescript
// Returns first page only
const page = await qb.runQuery({ from: 'tableId' });
console.log(page.data.length); // e.g., 100 records
console.log(page.metadata.totalRecords); // e.g., 5000 total
```

### Fetch All Pages

```typescript
// Automatically fetches all pages and combines results
const all = await qb.runQuery({ from: 'tableId' }).all();
console.log(all.data.length); // 5000 records
```

### Fetch with Record Limit

```typescript
// Fetch up to 500 records (may span multiple pages)
const limited = await qb.runQuery({ from: 'tableId' }).paginate({ limit: 500 });
console.log(limited.data.length); // 500 records
```

### Explicit Single Page

```typescript
// Explicitly fetch single page (useful when autoPaginate is enabled globally)
const single = await qb.runQuery({ from: 'tableId' }).noPaginate();
```

### Global Auto-Pagination

```typescript
const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  autoPaginate: true, // Default await now fetches all pages
});

// Now direct await fetches all pages
const all = await qb.runQuery({ from: 'tableId' });

// Use .noPaginate() to get single page
const page = await qb.runQuery({ from: 'tableId' }).noPaginate();
```

## Date Conversion

By default, ISO 8601 date strings in API responses are automatically converted to JavaScript `Date` objects:

```typescript
const app = await qb.getApp({ appId: 'bpqe82s1' });

// Date fields are now Date objects
console.log(app.created instanceof Date); // true
console.log(app.created.toISOString());   // "2024-01-15T10:30:00.000Z"

// Works with nested objects and arrays
const records = await qb.runQuery({ from: 'tableId' });
records.data.forEach(record => {
  // Date field values are converted
  console.log(record['7'].value instanceof Date); // true for date/timestamp fields
});
```

To disable date conversion and keep dates as strings:

```typescript
const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  convertDates: false, // Keep dates as ISO strings
});
```

## Schema Aliases

Use readable names for tables and fields instead of cryptic IDs. The SDK transforms aliases to IDs in requests and IDs back to aliases in responses.

### Defining a Schema

```typescript
const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  schema: {
    tables: {
      projects: {
        id: 'bqw3ryzab',
        fields: {
          id: 3,
          name: 6,
          status: 7,
          dueDate: 12,
          assignee: 15,
        },
      },
      tasks: {
        id: 'bqw4xyzcd',
        fields: {
          id: 3,
          title: 6,
          projectId: 8,
          completed: 10,
        },
      },
    },
  },
});
```

### Using Aliases in Queries

```typescript
// Use table and field aliases instead of IDs
const result = await qb.runQuery({
  from: 'projects',                          // Instead of 'bqw3ryzab'
  select: ['name', 'status', 'dueDate'],     // Instead of [6, 7, 12]
  where: "{'status'.EX.'Active'}",           // Field aliases in where clauses
  sortBy: [{ fieldId: 'dueDate', order: 'ASC' }],
});

// Response uses aliases and values are automatically unwrapped
console.log(result.data[0].name);     // "Project Alpha" (not { value: "Project Alpha" })
console.log(result.data[0].status);   // "Active"
console.log(result.data[0].dueDate);  // Date object (if convertDates is enabled)
```

### Upserting with Aliases

With schema, use field aliases as keys:

```typescript
await qb.upsert({
  to: 'projects',
  data: [
    { name: 'New Project', status: 'Planning' },
  ],
});
```

## Auto-Wrapping

Values are automatically wrapped in `{ value: X }` format for upserts. This works with or without a schema:

```typescript
// Clean syntax - values are auto-wrapped
{ '6': 'New Record', '7': 42 }

// Explicit wrapping also works (backwards compatible)
{ '6': { value: 'New Record' }, '7': { value: 42 } }
```

### Response Transformation

Responses are automatically transformed:
- Field ID keys (`'6'`) become aliases (`name`)
- Values are unwrapped from `{ value: X }` to just `X`
- Unknown fields (not in schema) keep their numeric key but are still unwrapped

```typescript
// Raw API response:
{ data: [{ '6': { value: 'Alpha' }, '99': { value: 'Custom' } }] }

// Transformed response (with schema):
{ data: [{ name: 'Alpha', '99': 'Custom' }] }
```

### Helpful Error Messages

Typos in aliases throw errors with suggestions:

```typescript
// Throws: Unknown field alias 'stauts' in table 'projects'. Did you mean 'status'?
await qb.runQuery({
  from: 'projects',
  select: ['stauts'],  // Typo!
});
```

### Generating Schema from QuickBase

Use the CLI to generate a schema from an existing app:

```bash
# Generate TypeScript schema file
npx quickbase-js schema -r "$QB_REALM" -a "$QB_APP_ID" -t "$QB_USER_TOKEN" -o schema.ts

# Generate JSON format
npx quickbase-js schema -r "$QB_REALM" -a "$QB_APP_ID" -t "$QB_USER_TOKEN" -f json -o schema.json

# Output to stdout
npx quickbase-js schema -r "$QB_REALM" -a "$QB_APP_ID" -t "$QB_USER_TOKEN"
```

The generator creates aliases from field labels using camelCase (e.g., "Due Date" → `dueDate`).

### Updating Schema with --merge

When your QuickBase app changes (new tables, new fields), use `--merge` to update your schema while preserving any custom aliases you've set:

```bash
# Update schema, preserving custom aliases
npx quickbase-js schema -r "$QB_REALM" -a "$QB_APP_ID" -t "$QB_USER_TOKEN" -o schema.ts --merge
```

**What merge does:**
- Preserves your custom table and field aliases (matched by ID, not name)
- Adds new tables and fields with auto-generated aliases
- Reports what changed:

```
Merge complete:
  Tables: 2 preserved, 1 added, 0 removed
  Fields: 15 preserved, 3 added, 0 removed
```

This lets you rename auto-generated aliases like `dateCreated` to `created` and keep them through updates.

### Using a Separate Schema File

You can define your schema in a separate file and import it:

**schema.ts**
```typescript
import type { Schema } from 'quickbase-js';

export const schema: Schema = {
  tables: {
    projects: {
      id: 'bqw3ryzab',
      fields: {
        id: 3,
        name: 6,
        status: 7,
        dueDate: 12,
      },
    },
  },
};
```

**client.ts**
```typescript
import { createClient } from 'quickbase-js';
import { schema } from './schema.js';

const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  schema,
});
```

Or use a JSON file:

**schema.json**
```json
{
  "tables": {
    "projects": {
      "id": "bqw3ryzab",
      "fields": { "id": 3, "name": 6, "status": 7 }
    }
  }
}
```

```typescript
import { createClient } from 'quickbase-js';
import schema from './schema.json' assert { type: 'json' };

const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  schema,
});
```

## Configuration Options

```typescript
const qb = createClient({
  // Required
  realm: 'mycompany',
  auth: { /* see authentication section */ },

  // Optional
  debug: false,                              // Enable debug logging
  timeout: 30000,                            // Request timeout in ms
  baseUrl: 'https://api.quickbase.com/v1',   // API base URL
  autoPaginate: false,                       // Auto-paginate on direct await
  convertDates: true,                        // Convert ISO date strings to Date objects
  schema: { /* see schema aliases section */ }, // Table and field aliases

  // Rate limiting
  rateLimit: {
    // Optional client-side throttling
    // QuickBase allows 100 requests per 10 seconds per user token
    proactiveThrottle: {
      enabled: false,
      requestsPer10Seconds: 100,
    },

    // Retry configuration for 429 and 5xx errors
    retry: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      multiplier: 2,
    },

    // Callback when rate limited
    onRateLimit: (info) => {
      console.log(`Rate limited! Retry after ${info.retryAfter}s`);
      console.log(`Request: ${info.requestUrl}`);
      console.log(`Ray ID: ${info.qbApiRay}`);
    },
  },
});
```

## API Methods

All QuickBase API endpoints are available as typed methods:

```typescript
// Apps
const app = await qb.getApp({ appId: 'bpqe82s1' });
const newApp = await qb.createApp({ name: 'My App', description: 'Test' });
await qb.updateApp({ appId: 'bpqe82s1' }, { name: 'Updated Name' });
await qb.deleteApp({ appId: 'bpqe82s1' }, { name: 'My App' });

// Tables
const tables = await qb.getAppTables({ appId: 'bpqe82s1' });
const table = await qb.getTable({ appId: 'bpqe82s1', tableId: 'byyy82s1' });

// Fields
const fields = await qb.getFields({ tableId: 'byyy82s1' });

// Records
const records = await qb.runQuery({
  from: 'byyy82s1',
  select: [3, 6, 7],
  where: "{6.GT.100}",
  sortBy: [{ fieldId: 3, order: 'ASC' }],
  options: { top: 100, skip: 0 },
});

// Insert/Update records (values are auto-wrapped)
const result = await qb.upsert({
  to: 'byyy82s1',
  data: [
    { '6': 'New Record', '7': 42 },
  ],
});

// Delete records
await qb.deleteRecords({
  from: 'byyy82s1',
  where: "{3.EX.123}",
});

// Reports
const report = await qb.runReport(
  { reportId: 'abc123', tableId: 'byyy82s1' },
  { skip: 0, top: 100 }
);

// Users
const users = await qb.getUsers(
  { accountId: '123456' },
  { appIds: ['bpqe82s1'] }
);
```

### Raw Request

For endpoints not covered by typed methods, use the generic `request` method:

```typescript
const result = await qb.request<MyResponseType>({
  method: 'POST',
  path: '/some/endpoint',
  body: { key: 'value' },
  query: { param: 'value' },
});
```

## Error Handling

```typescript
import {
  QuickbaseError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ServerError,
} from 'quickbase-js';

try {
  await qb.getApp({ appId: 'invalid' });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    console.log(`Ray ID: ${error.rayId}`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid or expired token');
  } else if (error instanceof AuthorizationError) {
    console.log('Permission denied');
  } else if (error instanceof NotFoundError) {
    console.log('Resource not found');
  } else if (error instanceof ValidationError) {
    console.log('Bad request:', error.message);
  } else if (error instanceof ServerError) {
    console.log('Server error:', error.statusCode);
  } else if (error instanceof QuickbaseError) {
    console.log(`API error ${error.statusCode}: ${error.message}`);
  }
}
```

## Rate Limiting

QuickBase enforces a rate limit of **100 requests per 10 seconds** per user token. This SDK follows [QuickBase's official rate limiting guidance](https://developer.quickbase.com/rateLimit) — relying on server-side `Retry-After` headers by default, with optional client-side throttling.

### How 429 Errors Are Handled

When the SDK receives a 429 (Too Many Requests) response, it automatically:

1. **Extracts rate limit info** from response headers (`Retry-After`, `cf-ray`, `qb-api-ray`)
2. **Calls the `onRateLimit` callback** if configured, allowing you to log or monitor
3. **Waits before retrying** - uses the `Retry-After` header if present, otherwise exponential backoff with jitter
4. **Retries the request** up to `maxAttempts` times (default: 3)
5. **Throws a `RateLimitError`** if all retries are exhausted

```
Request fails with 429
        ↓
Extract Retry-After header
        ↓
Call onRateLimit callback (if set)
        ↓
Wait (Retry-After or exponential backoff)
        ↓
Retry request (up to maxAttempts)
        ↓
Throw RateLimitError if exhausted
```

### Retry Configuration

```typescript
const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  rateLimit: {
    retry: {
      maxAttempts: 5,        // Default: 3
      initialDelayMs: 1000,  // Default: 1000ms
      maxDelayMs: 30000,     // Default: 30000ms
      multiplier: 2,         // Default: 2
    },
  },
});
```

The backoff formula with jitter: `delay = initialDelayMs * (multiplier ^ attempt) ± 10%`

### Proactive Throttling

Prevent 429 errors entirely by throttling requests client-side using a sliding window algorithm:

```typescript
const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  rateLimit: {
    proactiveThrottle: {
      enabled: true,
      requestsPer10Seconds: 100,
    },
  },
});
```

This tracks request timestamps and blocks new requests when the limit would be exceeded, waiting until the oldest request exits the 10-second window.

### Rate Limit Callback

Get notified when rate limited (called before retry):

```typescript
const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  rateLimit: {
    onRateLimit: (info) => {
      console.log(`Rate limited on ${info.requestUrl}`);
      console.log(`Retry after: ${info.retryAfter} seconds`);
      console.log(`Ray ID: ${info.qbApiRay}`);
      console.log(`Attempt: ${info.attempt}`);
    },
  },
});
```

### Handling RateLimitError

If retries are exhausted, a `RateLimitError` is thrown:

```typescript
import { RateLimitError } from 'quickbase-js';

try {
  await qb.getApp({ appId: 'bpqe82s1' });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited after ${error.rateLimitInfo.attempt} attempts`);
    console.log(`Retry after: ${error.retryAfter} seconds`);
  }
}
```

## Migration from v1

### Authentication

```typescript
// v1 - user token
const qb = quickbase({ realm: 'company', userToken: 'token' });

// v2 - user token (explicit type)
const qb = createClient({
  realm: 'company',
  auth: { type: 'user-token', userToken: 'token' },
});

// v1 - temp tokens in Code Pages
const qb = quickbase({ realm: 'company', useTempTokens: true });

// v2 - temp tokens in Code Pages
const qb = createClient({
  realm: 'company',
  auth: { type: 'temp-token' },
});
```

### Pagination

```typescript
// v1 - callback-based
await qb.withPaginationDisabled(async () => qb.runQuery({ body: { from: tableId } }));
await qb.withPaginationLimit(100, async () => qb.runQuery({ body: { from: tableId } }));

// v2 - fluent API
await qb.runQuery({ from: tableId }).noPaginate();
await qb.runQuery({ from: tableId }).paginate({ limit: 100 });
```

### Request Body

```typescript
// v1 - body wrapper
await qb.runQuery({ body: { from: tableId, select: [3, 6] } });

// v2 - direct parameters
await qb.runQuery({ from: tableId, select: [3, 6] });
```

## Development

```bash
# Clone with submodules (includes OpenAPI spec)
git clone --recurse-submodules https://github.com/DrewBradfordXYZ/quickbase-js.git

# Or if already cloned, initialize submodules
git submodule update --init

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run typecheck

# Generate types from OpenAPI spec
npm run spec:generate
```

### Updating the OpenAPI Spec

The `spec/` directory is a Git submodule pointing to [quickbase-spec](https://github.com/DrewBradfordXYZ/quickbase-spec). Each SDK pins to a specific commit, so spec updates are controlled:

```bash
# Update to latest spec
cd spec
git pull origin main
cd ..
git add spec
git commit -m "Update quickbase-spec submodule"

# Regenerate types
npm run spec:generate
```

### Spec Tools

```bash
# Full spec processing pipeline
npm run spec:build

# Individual steps
npm run spec:convert   # Swagger 2.0 → OpenAPI 3.0
npm run spec:patch     # Apply fixes from overrides
npm run spec:validate  # Validate spec
npm run spec:split     # Split by tag (for editing)
npm run spec:generate  # Generate TypeScript types
```

### Documentation

API documentation is auto-generated from source code and hosted at:
**https://drewbradfordxyz.github.io/quickbase-js/**

To generate docs locally:

```bash
npm run docs        # Generate docs to ./docs
npm run docs:watch  # Watch mode for development
```

Documentation is built with [TypeDoc](https://typedoc.org/) and auto-deployed to GitHub Pages on every push to main.

## License

MIT
