/**
 * Date and Date/Time field values
 *
 * QuickBase has two kinds of date field, and the JSON API treats them
 * differently (checked against a live realm, 2026-11-12):
 *
 * - A Date field holds a calendar day. It returns "2024-01-15" and accepts
 *   only that form: a timestamp, US format or epoch milliseconds is rejected.
 * - A Date/Time field holds a moment. It returns UTC ("2024-01-15T15:30:00Z")
 *   and accepts ISO 8601 with Z or an offset. Without a zone, QuickBase reads
 *   the time in the app's time zone. A bare date is rejected.
 *
 * Neither field accepts the other's form, so a value sent to QuickBase has to
 * say which it is. Query and report results do, through their `fields` types:
 * Date fields become {@link QuickbaseDate}, Date/Time fields
 * {@link QuickbaseDateTime}. Both are Dates that serialize as their field
 * expects, so a value read and upserted back is accepted. A plain Date says
 * neither, and an upsert refuses it ({@link assertNoPlainDate}).
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/**
 * A Date field's value: a calendar day, held as local midnight.
 *
 * Read it with local methods (`getDate()`, `toLocaleDateString()`), which give
 * the stored day in any time zone, in a browser or on a server. It serializes
 * as the day ("2024-01-15"), so `JSON.stringify` carries the day rather than a
 * moment: sent from a server to a browser in another time zone, or upserted
 * back to QuickBase, it stays the same day.
 *
 * `toISOString()` is still a moment (local midnight in UTC), and its date part
 * is the day before east of UTC. Use {@link QuickbaseDate.toISODate} instead.
 */
export class QuickbaseDate extends Date {
  /** Which kind of QuickBase date this is */
  readonly kind = 'date' as const;

  /**
   * @param year - Full year (2024)
   * @param month - Month, 1-12 (unlike Date's 0-11)
   * @param day - Day of the month, 1-31
   */
  constructor(year: number, month: number, day: number) {
    super(year, month - 1, day);
    // Date(y, m, d) maps years 0-99 to 1900-1999
    if (year >= 0 && year < 100) this.setFullYear(year);
  }

  /** A Date field's value as QuickBase sends it ("2024-01-15"). */
  static fromValue(value: string): QuickbaseDate {
    const match = DATE_ONLY.exec(value);
    if (!match) {
      throw new RangeError(`Not a QuickBase date (YYYY-MM-DD): ${JSON.stringify(value)}`);
    }
    return new QuickbaseDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  /** The local calendar day of a Date, for a Date field. */
  static from(date: Date): QuickbaseDate {
    return new QuickbaseDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  }

  /** Today, in the local time zone. */
  static today(): QuickbaseDate {
    return QuickbaseDate.from(new Date());
  }

  /** The day as QuickBase reads and writes it: "2024-01-15". */
  toISODate(): string {
    return `${pad(this.getFullYear(), 4)}-${pad(this.getMonth() + 1)}-${pad(this.getDate())}`;
  }

  /** Serializes as the day, the only form a Date field accepts. */
  override toJSON(): string {
    return this.toISODate();
  }
}

/**
 * A Date/Time field's value: a moment. It serializes as ISO 8601 in UTC, which
 * a Date/Time field accepts (QuickBase keeps whole seconds).
 */
export class QuickbaseDateTime extends Date {
  /** Which kind of QuickBase date this is */
  readonly kind = 'datetime' as const;

  /** @param time - Milliseconds since the epoch */
  constructor(time: number) {
    super(time);
  }

  /** A Date/Time field's value as QuickBase sends it ("2024-01-15T15:30:00Z"). */
  static fromValue(value: string): QuickbaseDateTime {
    const time = Date.parse(value);
    if (Number.isNaN(time) || DATE_ONLY.test(value)) {
      throw new RangeError(`Not a QuickBase date/time (ISO 8601): ${JSON.stringify(value)}`);
    }
    return new QuickbaseDateTime(time);
  }

  /** The same moment as a Date, for a Date/Time field. */
  static from(date: Date): QuickbaseDateTime {
    return new QuickbaseDateTime(date.getTime());
  }

  /** The current moment. */
  static current(): QuickbaseDateTime {
    return new QuickbaseDateTime(Date.now());
  }
}

/** Field types whose values are converted, and how */
const CONVERTERS: Record<string, (value: string) => Date> = {
  date: QuickbaseDate.fromValue,
  timestamp: QuickbaseDateTime.fromValue,
};

/**
 * Convert Date and Date/Time values in a query or report result, using the
 * field types in its `fields`. Other fields, blank values ("") and responses
 * without `fields` (an upsert's) are left as they are. Values keep their
 * { value } wrapper and field ID keys; this runs before schema aliases.
 */
export function convertRecordDates<T>(response: T): T {
  if (!response || typeof response !== 'object') return response;
  const { fields, data } = response as { fields?: unknown; data?: unknown };
  if (!Array.isArray(fields) || !Array.isArray(data)) return response;

  const converters = new Map<string, (value: string) => Date>();
  for (const field of fields as Array<{ id?: unknown; type?: unknown }>) {
    const convert = typeof field.type === 'string' ? CONVERTERS[field.type] : undefined;
    if (convert && field.id !== undefined) converters.set(String(field.id), convert);
  }
  if (converters.size === 0) return response;

  const converted = (data as Array<Record<string, unknown>>).map((record) => {
    const result: Record<string, unknown> = { ...record };
    for (const [fieldId, convert] of converters) {
      const cell = record[fieldId] as { value?: unknown } | undefined;
      if (!cell || typeof cell.value !== 'string' || cell.value === '') continue;
      try {
        result[fieldId] = { ...cell, value: convert(cell.value) };
      } catch {
        // A form QuickBase doesn't document; keep the string
      }
    }
    return result;
  });

  return { ...response, data: converted } as T;
}

/**
 * Throw if a value to upsert is a plain Date. QuickBase rejects a Date
 * field's value in any form but "2024-01-15" and a Date/Time field's in that
 * form, so a Date that doesn't say which it is can't be sent correctly. The
 * request isn't sent: a rejected value would leave the field blank on a
 * record QuickBase still saves.
 */
export function assertNoPlainDate(value: unknown, field: string, recordIndex: number): void {
  if (value instanceof Date && !(value instanceof QuickbaseDate) && !(value instanceof QuickbaseDateTime)) {
    throw new TypeError(
      `Field ${JSON.stringify(field)} in record ${recordIndex + 1} is a plain Date, which QuickBase ` +
        'can store only once it knows the field type. For a Date field use QuickbaseDate.from(value) ' +
        '(or "YYYY-MM-DD"); for a Date/Time field use QuickbaseDateTime.from(value) (or value.toISOString()).'
    );
  }
}
