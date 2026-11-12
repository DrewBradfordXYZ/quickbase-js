/**
 * Types from a schema
 *
 * A schema whose fields carry their QuickBase type (what `npx quickbase-js
 * schema` writes, declared `as const`) types query results, report results
 * and upsert data by field name. Nothing here runs: these are types only.
 *
 * What each field type's value is was checked against a live realm
 * (2026-11-12), blanks included: text-like fields return "", number-like
 * fields null, multi-select text and multi-user fields [], a checkbox false,
 * an empty user field null, and date fields "".
 */

import type { QuickbaseDate, QuickbaseDateTime } from './dates.js';
import type { FieldValue, RunQueryFieldsItem, RunQueryMetadata, UpsertMetadata } from '../generated/types.js';

/** A user field's value */
export interface QuickbaseUser {
  id: string;
  email: string;
  name: string;
  userName?: string;
}

/** Any field value: a field the schema gives no type for, or a type not listed here */
export type AnyFieldValue = FieldValue['value'] | null;

type TextType = 'text' | 'text-multi-line' | 'text-multiple-choice' | 'rich-text' | 'phone' | 'email' | 'url' | 'timeofday';
type NumberType = 'numeric' | 'currency' | 'percent' | 'rating' | 'duration';

/**
 * The value a field of QuickBase type `T` has in a query or report result.
 * `Dates` is false when the client has `convertDates: false`, and for upsert
 * responses, which carry no field types: dates stay strings.
 */
export type FieldTypeValue<T, Dates extends boolean = true> =
  T extends TextType ? string
  : T extends NumberType ? number | null
  : T extends 'recordid' ? number
  : T extends 'checkbox' ? boolean
  : T extends 'multitext' ? string[]
  : T extends 'date' ? (Dates extends true ? QuickbaseDate | '' : string)
  : T extends 'timestamp' ? (Dates extends true ? QuickbaseDateTime | '' : string)
  : T extends 'user' ? QuickbaseUser | null
  : T extends 'multiuser' ? QuickbaseUser[]
  : AnyFieldValue;

/**
 * What an upsert takes for a field of QuickBase type `T`: a Date field a
 * QuickbaseDate or "YYYY-MM-DD", a Date/Time field a QuickbaseDateTime or an
 * ISO 8601 string (a plain Date is refused; see QuickbaseDate).
 */
export type FieldTypeInput<T> =
  T extends TextType ? string
  : T extends NumberType | 'recordid' ? number | null
  : T extends 'checkbox' ? boolean
  : T extends 'multitext' ? string[]
  : T extends 'date' ? QuickbaseDate | string
  : T extends 'timestamp' ? QuickbaseDateTime | string
  : AnyFieldValue;

type Tables<S> = S extends { tables: infer T } ? T : never;

/** A schema's table names */
export type TableName<S> = keyof Tables<S> & string;

type Fields<S, T extends TableName<S>> = Tables<S>[T] extends { fields: infer F } ? F : never;
type TypeOf<F> = F extends { type: infer T } ? T : undefined;
type IdOf<F> = F extends number ? F : F extends { id: infer I } ? I : never;

/** A field of table `T`: its name, or any field ID */
export type FieldRef<S, T extends TableName<S>> = (keyof Fields<S, T> & string) | number;

/** The names of the fields that refs (names or IDs) point to */
type NamesOf<F, Ref> = {
  [K in keyof F]: K extends Ref ? K : IdOf<F[K]> extends Ref ? K : never;
}[keyof F];

/** A record of table `T` as query and report results have it: keyed by field name */
export type SchemaRecord<S, T extends TableName<S>, Dates extends boolean = true> = {
  -readonly [K in keyof Fields<S, T>]: FieldTypeValue<TypeOf<Fields<S, T>[K]>, Dates>;
};

/** Fields QuickBase computes (formula, lookup, summary), which can't be written */
type ComputedNames<F> = {
  [K in keyof F]: F[K] extends { mode: 'formula' | 'lookup' | 'summary' } ? K : never;
}[keyof F];

/** A record of table `T` to upsert: writable fields by name, plain or as { value } */
export type SchemaRecordInput<S, T extends TableName<S>> = {
  -readonly [K in Exclude<keyof Fields<S, T>, ComputedNames<Fields<S, T>>>]?:
    | FieldTypeInput<TypeOf<Fields<S, T>[K]>>
    | { value: FieldTypeInput<TypeOf<Fields<S, T>[K]>> };
};

/** A query's records: the selected fields, or every field (as optional) without a select */
export type QueryRecord<S, T extends TableName<S>, Selected, Dates extends boolean> =
  Selected extends readonly [] ? Partial<SchemaRecord<S, T, Dates>>
  : Selected extends readonly (infer Ref)[] ? Pick<SchemaRecord<S, T, Dates>, NamesOf<Fields<S, T>, Ref> & keyof Fields<S, T>>
  : Partial<SchemaRecord<S, T, Dates>>;

type SortOrder = 'ASC' | 'DESC' | 'equal-values';

/** runQuery's body for a schema table */
export interface SchemaQueryBody<S, T extends TableName<S>, Selected> {
  from: T;
  select?: Selected;
  where?: string;
  sortBy?: { fieldId: FieldRef<S, T>; order: SortOrder }[] | false;
  groupBy?: { fieldId: FieldRef<S, T>; grouping?: SortOrder }[];
  options?: { skip?: number; top?: number; compareWithAppLocalTime?: boolean };
}

/** runQuery's and runReport's response for a schema table */
export interface SchemaQueryResponse<R> {
  data: R[];
  fields?: RunQueryFieldsItem[];
  metadata?: RunQueryMetadata;
}

/** upsert's body for a schema table */
export interface SchemaUpsert<S, T extends TableName<S>> {
  to: T;
  data: SchemaRecordInput<S, T>[];
  mergeFieldId?: FieldRef<S, T>;
  fieldsToReturn?: FieldRef<S, T>[];
}

/**
 * upsert's response for a schema table. An upsert's response carries no
 * field types, so dates in it are strings.
 */
export interface SchemaUpsertResponse<S, T extends TableName<S>> {
  data: Partial<SchemaRecord<S, T, false>>[];
  metadata?: UpsertMetadata;
}

/** Whether a schema names its tables as literal types (declared `as const`) */
export type IsTypedSchema<S> = [TableName<S>] extends [never] ? false : string extends TableName<S> ? false : true;
