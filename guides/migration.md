# Migrating from v1

## Authentication

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

## Pagination

```typescript
// v1 - callback-based
await qb.withPaginationDisabled(async () => qb.runQuery({ body: { from: tableId } }));
await qb.withPaginationLimit(100, async () => qb.runQuery({ body: { from: tableId } }));

// v2 - fluent API
await qb.runQuery({ from: tableId }).noPaginate();
await qb.runQuery({ from: tableId }).paginate({ limit: 100 });
```

## Request Body

```typescript
// v1 - body wrapper
await qb.runQuery({ body: { from: tableId, select: [3, 6] } });

// v2 - direct parameters
await qb.runQuery({ from: tableId, select: [3, 6] });
```
