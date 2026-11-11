# Schema aliases

A schema names your tables and fields. With one, the client translates names to IDs in requests (`from`, `to`, `select`, `where`, `sortBy`, `groupBy`, upsert data) and back in responses: records come keyed by name, with values unwrapped from `{ value }`. IDs still work everywhere, and fields the schema doesn't name keep their ID as the key.

```typescript
import { createClient } from 'quickbase-js';
import type { Schema } from 'quickbase-js';

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
```

```typescript
const result = await qb.runQuery({
  from: 'projects',
  select: ['name', 'status'],
  where: "{'status'.EX.'Active'}",
  sortBy: [{ fieldId: 'dueDate', order: 'ASC' }],
});
const first = result.data?.[0] as Record<string, unknown> | undefined; // cast: keyed by alias, unwrapped
console.log(first?.name, first?.status);

await qb.upsert({ to: 'projects', data: [{ name: 'Alpha', status: 'Active' }] });
```

Requests are typed to accept aliases. Results are typed by field ID with `{ value }` wrappers, so an aliased record needs the cast shown (TypeScript only).

A name the schema doesn't have throws, suggesting the closest one: `... Did you mean 'status'?`

## Generating a schema

```bash
npx quickbase-js schema -r "$QB_REALM" -a "$QB_APP_ID" -t "$QB_USER_TOKEN" -o schema.ts
npx quickbase-js schema -r "$QB_REALM" -a "$QB_APP_ID" -t "$QB_USER_TOKEN" -f json -o schema.json
```

Aliases come from labels in camelCase ("Due Date" becomes `dueDate`). Rename any you like, then regenerate with `--merge` when the app changes: aliases you set are kept (matched by ID), new tables and fields are added, and it reports what changed.

A JSON schema can be imported directly: `import schema from './schema.json' with { type: 'json' }`.

## The XML API

`createXmlClient(qb)` uses the same schema; see [xml-api.md](xml-api.md#schema-aliases).
