/**
 * Types from a schema: compiled by `npm run typecheck` (tsconfig.types.json),
 * never run. A line marked @ts-expect-error must fail to compile; one that
 * compiles fails the check.
 */

import {
  createClient,
  QuickbaseDate,
  QuickbaseDateTime,
  type AnyFieldValue,
  type QuickbaseUser,
  type RunQueryResponse,
  type Schema,
} from '../../src/index.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
function expectType<_T extends true>(): void {}

// As `npx quickbase-js schema` writes it
const schema = {
  tables: {
    projects: {
      id: 'bqprojects',
      fields: {
        recordId: { id: 3, type: 'recordid' },
        name: { id: 6, type: 'text' },
        dueDate: { id: 7, type: 'date' },
        closedAt: { id: 8, type: 'timestamp' },
        budget: { id: 9, type: 'currency' },
        tags: { id: 10, type: 'multitext' },
        done: { id: 11, type: 'checkbox' },
        owner: { id: 4, type: 'user' },
        taskCount: { id: 12, type: 'numeric', mode: 'summary' },
        link: { id: 13, type: 'url', mode: 'formula' },
        location: { id: 14, type: 'address' },
      },
    },
    tasks: { id: 'bqtasks', fields: { title: { id: 6, type: 'text' } } },
  },
} as const satisfies Schema;

const auth = { type: 'user-token', userToken: 'token' } as const;
const qb = createClient({ realm: 'r', auth, schema });

export async function queries(): Promise<void> {
  // Selected fields, typed; dates converted
  const result = await qb.runQuery({ from: 'projects', select: ['name', 'dueDate', 'closedAt', 'budget'] });
  expectType<
    Equal<
      (typeof result.data)[number],
      { name: string; dueDate: QuickbaseDate | ''; closedAt: QuickbaseDateTime | ''; budget: number | null }
    >
  >();

  // Field IDs select the same fields
  const byId = await qb.runQuery({ from: 'projects', select: [6, 11] });
  expectType<Equal<(typeof byId.data)[number], { name: string; done: boolean }>>();

  // No select: every field, optional
  const all = await qb.runQuery({ from: 'projects' });
  const first = all.data[0]!;
  expectType<Equal<typeof first.tags, string[] | undefined>>();
  expectType<Equal<typeof first.owner, QuickbaseUser | null | undefined>>();
  expectType<Equal<typeof first.location, AnyFieldValue | undefined>>();

  // .all() pages keep the type
  const paged = await qb.runQuery({ from: 'tasks', select: ['title'] }).all();
  expectType<Equal<(typeof paged.data)[number], { title: string }>>();

  // @ts-expect-error: a field the table doesn't have
  await qb.runQuery({ from: 'projects', select: ['nmae'] });

  const picked = await qb.runQuery({ from: 'projects', select: ['name'] });
  // @ts-expect-error: not selected
  void picked.data[0]!.budget;

  // sortBy and groupBy take field names
  await qb.runQuery({ from: 'projects', sortBy: [{ fieldId: 'dueDate', order: 'ASC' }] });
  // @ts-expect-error: a field the table doesn't have
  await qb.runQuery({ from: 'projects', sortBy: [{ fieldId: 'due', order: 'ASC' }] });

  // A table the schema doesn't name: the untyped forms
  const raw = await qb.runQuery({ from: 'bqother', select: [3] });
  expectType<Equal<typeof raw, RunQueryResponse>>();

  // Reports: columns unknown, so every field optional
  const report = await qb.runReport({ reportId: '1', tableId: 'projects' });
  expectType<Equal<typeof report.data[number]['dueDate'], QuickbaseDate | '' | undefined>>();

  // withSignal keeps the types
  const cancellable = await qb.withSignal(new AbortController().signal).runQuery({ from: 'tasks', select: ['title'] });
  expectType<Equal<(typeof cancellable.data)[number], { title: string }>>();
}

export async function upserts(): Promise<void> {
  const saved = await qb.upsert({
    to: 'projects',
    data: [{ name: 'Alpha', dueDate: QuickbaseDate.today(), closedAt: '2024-01-15T15:30:00Z', budget: 10, tags: ['a'] }],
    fieldsToReturn: ['name', 'dueDate'],
    mergeFieldId: 'name',
  });
  // An upsert's response carries no field types: dates are strings
  expectType<Equal<(typeof saved.data)[number]['dueDate'], string | undefined>>();

  // { value } wrappers work too
  await qb.upsert({ to: 'projects', data: [{ name: { value: 'Alpha' } }] });

  // @ts-expect-error: a formula field can't be written
  await qb.upsert({ to: 'projects', data: [{ link: 'https://example.com' }] });
  // @ts-expect-error: a summary field can't be written
  await qb.upsert({ to: 'projects', data: [{ taskCount: 3 }] });
  // @ts-expect-error: text field, number value
  await qb.upsert({ to: 'projects', data: [{ name: 5 }] });
  // @ts-expect-error: a plain Date could be a Date or a Date/Time value
  await qb.upsert({ to: 'projects', data: [{ dueDate: new Date() }] });
  // @ts-expect-error: a field the table doesn't have
  await qb.upsert({ to: 'projects', data: [{ nmae: 'Alpha' }] });
}

export async function options(): Promise<void> {
  // convertDates: false keeps dates as strings
  const plain = createClient({ realm: 'r', auth, schema, convertDates: false });
  const result = await plain.runQuery({ from: 'projects', select: ['dueDate', 'closedAt'] });
  expectType<Equal<(typeof result.data)[number], { dueDate: string; closedAt: string }>>();

  // Fields without types (bare IDs): any field value
  const untyped = createClient({
    realm: 'r',
    auth,
    schema: { tables: { projects: { id: 'bqprojects', fields: { name: 6 } } } },
  });
  const loose = await untyped.runQuery({ from: 'projects', select: ['name'] });
  expectType<Equal<(typeof loose.data)[number], { name: AnyFieldValue }>>();

  // A schema typed only as Schema, and no schema: the untyped API, as before
  const wide: Schema = schema;
  const widened = await createClient({ realm: 'r', auth, schema: wide }).runQuery({ from: 'projects' });
  expectType<Equal<typeof widened, RunQueryResponse>>();
  const none = await createClient({ realm: 'r', auth }).runQuery({ from: 'bqprojects' });
  expectType<Equal<typeof none, RunQueryResponse>>();
}
