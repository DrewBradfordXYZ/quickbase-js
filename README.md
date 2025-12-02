# QuickBase JS SDK v2

A TypeScript/JavaScript client for the QuickBase JSON RESTful API.

## Features

- **Typed API Methods** - Full TypeScript support with auto-generated types from OpenAPI spec
- **Multiple Auth Methods** - User token, temporary token, and SSO authentication
- **Fluent Pagination** - Chain `.all()`, `.paginate()`, or `.noPaginate()` on paginated endpoints
- **Date Conversion** - Automatic conversion of ISO date strings to JavaScript Date objects
- **Rate Limit Handling** - Automatic retry with exponential backoff on 429 errors
- **Proactive Throttling** - Optional client-side request throttling
- **Tree-Shakeable** - Static method generation for optimal bundle size

## API Reference

**[View all 59 API methods →](./interfaces/QuickbaseAPI.html)**

The SDK provides typed methods for all QuickBase API endpoints including Apps, Tables, Fields, Records, Reports, Users, and more. Each method includes JSDoc documentation with links to the official QuickBase API docs.

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

  const client = QuickBase.createClient({
    realm: realm,
    auth: { type: 'temp-token' },
  });

  client.getApp({ appId: 'bpqe82s1' }).then(app => {
    console.log(app.name);
  });
</script>
```

Or with ES modules:

```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/quickbase-js@2/dist/quickbase.esm.js';

  const client = createClient({
    realm: 'mycompany',
    auth: { type: 'temp-token' },
  });

  const app = await client.getApp({ appId: 'bpqe82s1' });
  console.log(app.name);
</script>
```

## Quick Start

```typescript
import { createClient } from 'quickbase-js';

const client = createClient({
  realm: 'mycompany',
  auth: {
    type: 'user-token',
    userToken: 'your-user-token',
  },
});

// Use typed API methods
const app = await client.getApp({ appId: 'bpqe82s1' });
console.log(app.name);

// Query records
const records = await client.runQuery({
  from: 'bpqe82s1',
  select: [3, 6, 7],
  where: "{6.EX.'Active'}",
});
console.log(records.data);
```

## Authentication

### User Token (Recommended for Server-Side)

```typescript
const client = createClient({
  realm: 'mycompany',
  auth: {
    type: 'user-token',
    userToken: 'your-user-token',
  },
});
```

### Temporary Token (Recommended for Browser/Code Pages)

Temporary tokens are automatically fetched and cached per database. They refresh on 401 errors.

```typescript
// In QuickBase Code Pages - no user token needed (uses browser session)
const client = createClient({
  realm: 'mycompany',
  auth: {
    type: 'temp-token',
  },
});

// Outside Code Pages - user token required to fetch temp tokens
const client = createClient({
  realm: 'mycompany',
  auth: {
    type: 'temp-token',
    userToken: 'your-user-token',      // Required outside Code Pages
    appToken: 'optional-app-token',    // If app requires it
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
const client = createClient({
  realm: 'mycompany',
  auth: {
    type: 'sso',
    samlToken: 'your-saml-token',
  },
});
```

## Pagination

Paginated endpoints (`runQuery`, `runReport`, `getUsers`, etc.) return a `PaginatedRequest` that supports fluent pagination methods.

### Default Behavior (Single Page)

```typescript
// Returns first page only
const page = await client.runQuery({ from: 'tableId' });
console.log(page.data.length); // e.g., 100 records
console.log(page.metadata.totalRecords); // e.g., 5000 total
```

### Fetch All Pages

```typescript
// Automatically fetches all pages and combines results
const all = await client.runQuery({ from: 'tableId' }).all();
console.log(all.data.length); // 5000 records
```

### Fetch with Record Limit

```typescript
// Fetch up to 500 records (may span multiple pages)
const limited = await client.runQuery({ from: 'tableId' }).paginate({ limit: 500 });
console.log(limited.data.length); // 500 records
```

### Explicit Single Page

```typescript
// Explicitly fetch single page (useful when autoPaginate is enabled globally)
const single = await client.runQuery({ from: 'tableId' }).noPaginate();
```

### Global Auto-Pagination

```typescript
const client = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  autoPaginate: true, // Default await now fetches all pages
});

// Now direct await fetches all pages
const all = await client.runQuery({ from: 'tableId' });

// Use .noPaginate() to get single page
const page = await client.runQuery({ from: 'tableId' }).noPaginate();
```

## Date Conversion

By default, ISO 8601 date strings in API responses are automatically converted to JavaScript `Date` objects:

```typescript
const app = await client.getApp({ appId: 'bpqe82s1' });

// Date fields are now Date objects
console.log(app.created instanceof Date); // true
console.log(app.created.toISOString());   // "2024-01-15T10:30:00.000Z"

// Works with nested objects and arrays
const records = await client.runQuery({ from: 'tableId' });
records.data.forEach(record => {
  // Date field values are converted
  console.log(record['7'].value instanceof Date); // true for date/timestamp fields
});
```

To disable date conversion and keep dates as strings:

```typescript
const client = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  convertDates: false, // Keep dates as ISO strings
});
```

## Configuration Options

```typescript
const client = createClient({
  // Required
  realm: 'mycompany',
  auth: { /* see authentication section */ },

  // Optional
  debug: false,                              // Enable debug logging
  timeout: 30000,                            // Request timeout in ms
  baseUrl: 'https://api.quickbase.com/v1',   // API base URL
  autoPaginate: false,                       // Auto-paginate on direct await
  convertDates: true,                        // Convert ISO date strings to Date objects

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
const app = await client.getApp({ appId: 'bpqe82s1' });
const newApp = await client.createApp({ name: 'My App', description: 'Test' });
await client.updateApp({ appId: 'bpqe82s1' }, { name: 'Updated Name' });
await client.deleteApp({ appId: 'bpqe82s1' }, { name: 'My App' });

// Tables
const tables = await client.getAppTables({ appId: 'bpqe82s1' });
const table = await client.getTable({ appId: 'bpqe82s1', tableId: 'byyy82s1' });

// Fields
const fields = await client.getFields({ tableId: 'byyy82s1' });

// Records
const records = await client.runQuery({
  from: 'byyy82s1',
  select: [3, 6, 7],
  where: "{6.GT.100}",
  sortBy: [{ fieldId: 3, order: 'ASC' }],
  options: { top: 100, skip: 0 },
});

// Insert/Update records
const result = await client.upsert({
  to: 'byyy82s1',
  data: [
    { '6': { value: 'New Record' }, '7': { value: 42 } },
  ],
});

// Delete records
await client.deleteRecords({
  from: 'byyy82s1',
  where: "{3.EX.123}",
});

// Reports
const report = await client.runReport(
  { reportId: 'abc123', tableId: 'byyy82s1' },
  { skip: 0, top: 100 }
);

// Users
const users = await client.getUsers(
  { accountId: '123456' },
  { appIds: ['bpqe82s1'] }
);
```

### Raw Request

For endpoints not covered by typed methods, use the generic `request` method:

```typescript
const result = await client.request<MyResponseType>({
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
  await client.getApp({ appId: 'invalid' });
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

## Migration from v1

### Authentication

```typescript
// v1 - user token
const qb = quickbase({ realm: 'company', userToken: 'token' });

// v2 - user token (explicit type)
const client = createClient({
  realm: 'company',
  auth: { type: 'user-token', userToken: 'token' },
});

// v1 - temp tokens in Code Pages
const qb = quickbase({ realm: 'company', useTempTokens: true });

// v2 - temp tokens in Code Pages
const client = createClient({
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
await client.runQuery({ from: tableId }).noPaginate();
await client.runQuery({ from: tableId }).paginate({ limit: 100 });
```

### Request Body

```typescript
// v1 - body wrapper
await qb.runQuery({ body: { from: tableId, select: [3, 6] } });

// v2 - direct parameters
await client.runQuery({ from: tableId, select: [3, 6] });
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

Generate API documentation from source code:

```bash
npm run docs        # Generate docs to ./docs
npm run docs:watch  # Watch mode for development
```

The documentation is generated using [TypeDoc](https://typedoc.org/) and extracts JSDoc comments from the source code. Open `docs/index.html` to view locally.

## License

MIT
