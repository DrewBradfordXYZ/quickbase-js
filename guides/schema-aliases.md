# Schema aliases

A schema names your tables and fields. With one, the client translates names to IDs in requests (`from`, `to`, `select`, `where`, `sortBy`, `groupBy`, upsert data) and back in responses: records come keyed by name, with values unwrapped from `{ value }`. IDs still work everywhere, and fields the schema doesn't name keep their ID as the key.

```typescript
import { createClient } from 'quickbase-js';
import type { Schema } from 'quickbase-js';

const schema = {
  tables: {
    projects: {
      id: 'bqw3ryzab',
      fields: { id: 3, name: 6, status: 7, dueDate: 12 },
    },
  },
} as const satisfies Schema;
const qb = createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  schema,
});
```

```typescript
const result = await qb.runQuery({
  from: 'projects',
  select: ['name', 'status'],
  where: "{'status'.EX.'Active'}",
  sortBy: [{ fieldId: 'dueDate', order: 'ASC' }],
});
console.log(result.data[0]?.name, result.data[0]?.status);

await qb.upsert({ to: 'projects', data: [{ name: 'Alpha', status: 'Active' }] });
```

Requests accept names; results are keyed by name. How results are typed is in the next section.

A name the schema doesn't have throws, suggesting the closest one: `... Did you mean 'status'?`

## Typed results

A schema whose fields carry their QuickBase type, declared `as const`, types results and upserts by field name, with no interface to write and no cast. The generator writes this form:

```typescript
import type { Schema } from 'quickbase-js';

export const schema = {
  tables: {
    projects: {
      id: 'bqw3ryzab',
      fields: {
        name: { id: 6, type: 'text' },
        dueDate: { id: 12, type: 'date' },
        budget: { id: 14, type: 'currency' },
        taskCount: { id: 18, type: 'numeric', mode: 'summary' },
      },
    },
  },
} as const satisfies Schema;
```

```typescript
const qb = createClient({ realm, auth, schema });

const result = await qb.runQuery({ from: 'projects', select: ['name', 'dueDate'] });
result.data[0].name;     // string
result.data[0].dueDate;  // QuickbaseDate | ''
result.data[0].budget;   // compile error: not selected

await qb.upsert({ to: 'projects', data: [{ name: 'Alpha', dueDate: QuickbaseDate.today() }] });
// compile errors: a field the table doesn't have, a value of the wrong type,
// a plain Date, or a computed field (formula, lookup, summary)
```

| QuickBase field type | Result | Blank |
|---|---|---|
| text, multi-line, multiple choice, rich text, phone, email, URL, time of day | `string` | `""` |
| numeric, currency, percent, rating, duration (ms) | `number \| null` | `null` |
| record ID# | `number` | |
| checkbox | `boolean` | `false` |
| multi-select text | `string[]` | `[]` |
| date | `QuickbaseDate \| ''` | `""` |
| date/time (`timestamp`) | `QuickbaseDateTime \| ''` | `""` |
| user | `QuickbaseUser \| null` (`id`, `email`, `name`) | `null` |
| list-user | `QuickbaseUser[]` | `[]` |
| anything else (address, file, report link, ...) | any field value | |

Formula, lookup and summary fields have their result's type. With `convertDates: false`, dates are strings. The rest of the details:

- **`runQuery`** results have exactly the selected fields (names or IDs). Without `select`, QuickBase returns the table's default columns, so every field is optional.
- **`runReport`** with a table name: a report's columns aren't known in advance, so every field is optional.
- **`upsert`** data takes writable fields by name, plain or as `{ value }`; `fieldsToReturn` and `mergeFieldId` take names. Its response carries no field types, so dates in it are strings.
- A table ID instead of a name, a schema typed only as `Schema`, or fields given as bare IDs (`name: 6`) keep the untyped forms, as before. JSON schemas lose their literal types when imported; use the TypeScript output for typed results.

## Generating a schema

```bash
npx quickbase-js schema -r "$QB_REALM" -a "$QB_APP_ID" -t "$QB_USER_TOKEN" -o schema.ts
npx quickbase-js schema -r "$QB_REALM" -a "$QB_APP_ID" -t "$QB_USER_TOKEN" -f json -o schema.json
```

Aliases come from labels in camelCase ("Due Date" becomes `dueDate`), and each field gets its QuickBase type. Rename any alias you like, then regenerate with `--merge` when the app changes: aliases you set are kept (matched by ID), types are refreshed from QuickBase, new tables and fields are added, and it reports what changed. A schema in the older form (fields as bare IDs) merges into the typed form.

A JSON schema can be imported directly: `import schema from './schema.json' with { type: 'json' }`.

## The XML API

`createXmlClient(qb)` uses the same schema; see [xml-api.md](xml-api.md#schema-aliases).
