# Queries, pagination and records

## Pagination

QuickBase returns a page of records at a time, sized by record size (often about 100). Paginated methods (`runQuery`, `runReport`, `getUsers`, `platformAnalyticEventSummaries`, ...) return a `PaginatedRequest`:

```typescript
const page = await qb.runQuery({ from: 'bqtable1' }); // one page
console.log(page.data?.length, page.metadata?.totalRecords);

const all = await qb.runQuery({ from: 'bqtable1' }).all();                      // every page
const first500 = await qb.runQuery({ from: 'bqtable1' }).paginate({ limit: 500 }); // up to 500
const single = await qb.runQuery({ from: 'bqtable1' }).noPaginate();             // one page, always
```

With `autoPaginate: true` on the client, a plain `await` fetches every page and `.noPaginate()` gets one.

Reports run with their own filter, sort and columns, and paginate the same way:

```typescript
const reportRows = await qb.runReport({ reportId: '7', tableId: 'bqtable1' }).all();
```

## Queries

```typescript
await qb.runQuery({
  from: 'bqtable1',
  select: [3, 6, 7],
  where: '{6.GT.100}',
  sortBy: [{ fieldId: 3, order: 'ASC' }],
  options: { top: 100, skip: 0 },
});
```

Each record maps a field ID to `{ value }`: `record['6']?.value`. With a [schema](schema-aliases.md), records come back keyed by alias with plain values. Query strings use QuickBase's syntax, `{field.OPERATOR.'value'}` joined with `AND` and `OR` ([query components](https://help.quickbase.com/docs/components-of-a-query)).

## Upserts

`upsert` adds records, or updates the record whose merge field matches. Without `mergeFieldId`, QuickBase matches on the table's key field (usually Record ID#, field 3).

```typescript
const result = await qb.upsert({
  to: 'bqtable1',
  mergeFieldId: 9,
  data: [{ '9': { value: 'EXT-001' }, '6': { value: 'Alpha' } }],
  fieldsToReturn: [6],
});
console.log(result.metadata?.createdRecordIds, result.metadata?.updatedRecordIds);
```

Values are `{ value: ... }`. With a schema configured, plain values (`{ name: 'Alpha' }`) are wrapped for you; without one they are sent as given, which QuickBase rejects.

## Deletes

```typescript
await qb.deleteRecords({ from: 'bqtable1', where: '{3.EX.123}' });
```
