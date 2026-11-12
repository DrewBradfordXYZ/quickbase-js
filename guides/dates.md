# Dates

QuickBase has two kinds of date field, and they don't accept each other's values. The client gives each its own type, so a date is shown on the right day and written in the form its field accepts, in a browser or on a server.

| Field | QuickBase sends | In query and report results | It accepts |
|---|---|---|---|
| Date | `"2024-01-15"` | `QuickbaseDate` | only `"2024-01-15"` |
| Date/Time | `"2024-01-15T15:30:00Z"` (UTC) | `QuickbaseDateTime` | ISO 8601 with `Z` or an offset |
| Time of Day | `"15:30:00"` | the string | `"15:30"`, `"3:30 PM"`, ... |
| Duration | milliseconds (`5400000`) | the number | milliseconds or `"1:30:00"` |

What a field accepts was checked against a live realm. QuickBase rejects a Date field's value in any other form (a timestamp, `01-15-2024`, epoch milliseconds) and a Date/Time field's bare date. A Date/Time value without a zone is read in the app's time zone, so `"2024-01-15T15:30:00"` is 15:30 Pacific in a Pacific app.

A rejected value doesn't fail the upsert: QuickBase saves the record with that field blank and lists the value in `metadata.lineErrors`.

## Reading

```typescript
const result = await qb.runQuery({ from: tableId, select: [3, 7, 8] });
const due = result.data![0][7].value as QuickbaseDate;       // Date field
const closed = result.data![0][8].value as QuickbaseDateTime; // Date/Time field

due.toLocaleDateString();   // "1/15/2024", in any time zone
due.getDate();              // 15
due.toISODate();            // "2024-01-15"
closed.toLocaleString();    // the moment, in local time
```

Both are `Date`s, so every `Date` method works. Which fields are dates comes from the field types QuickBase sends with every query and report result, never from what a string looks like: a Text field holding `"2024-01-15"` stays a string. Blank dates are `""`.

`QuickbaseDate` is the day at local midnight, so local methods (`getDate()`, `getMonth()`) give the stored day wherever the code runs. As text it is the day:

- `JSON.stringify` and `String(date)` give `"2024-01-15"`, so a server can send it to a browser in another time zone and the day doesn't move, and `` `{7.AF.'${date}'}` `` filters on that day.
- `toLocaleDateString()` and `toLocaleString()` show the day whatever `timeZone` option they get. A server in UTC formatting for a user with `{ timeZone: 'America/New_York' }` would otherwise show the day before.
- `toISOString()` is still a moment: east of UTC its date part is the day before, so use `toISODate()`. A separate `Intl.DateTimeFormat(...).format(date)` also formats the moment; give it `date.toUTCDay()` and `{ timeZone: 'UTC' }`.

`structuredClone` and `postMessage` (Web Workers, IndexedDB) copy it as a plain `Date`; `QuickbaseDate.from(copy)` restores it.

Upsert responses don't include field types, so their values stay strings. So do the timestamps in app, table and field metadata (`created`, `updated`): those are UTC, and `new Date(value)` reads them exactly.

`convertDates: false` keeps every value as QuickBase sends it.

## Writing

Values the client returned can be upserted as they are. A date you create says which kind it is:

```typescript
import { QuickbaseDate, QuickbaseDateTime } from 'quickbase-js';

await qb.upsert({
  to: tableId,
  data: [{
    7: QuickbaseDate.today(),              // Date field: today, locally
    8: QuickbaseDateTime.current(),        // Date/Time field: now
    9: QuickbaseDate.from(someDate),       // the local day of a Date
    10: QuickbaseDateTime.from(someDate),  // the same moment
    11: new QuickbaseDate(2024, 1, 15),    // month 1-12
  }],
});
```

Strings work too: `"2024-01-15"` for a Date field, an ISO time such as `someDate.toISOString()` for a Date/Time field.

A plain `Date` is refused before anything is sent, with an error naming the field. QuickBase would store it correctly in only one of the two fields, and the client can't tell which field it is without another API call. TypeScript refuses it too.

`QuickbaseDate.today()` and `QuickbaseDate.from()` use the time zone of the code that runs them: in a browser the user's, on a server the server's (often UTC). On a server, a user's "today" may already be tomorrow in UTC; build the date from the user's own day when that matters.

## Upgrading from 2.x

2.x turned every string that looked like a date into a `Date`, at UTC midnight for a Date field. That showed the day before anywhere west of UTC, turned date-like text into Dates, and wrote a Date field back as a timestamp, which QuickBase rejects (leaving the field blank).

- Date fields are `QuickbaseDate`: read them with local methods. Code that compensated with `getUTCDate()` or `toISOString().slice(0, 10)` should use `getDate()` or `toISODate()`; east of UTC the old workarounds now give the day before.
- Date/Time fields are `QuickbaseDateTime`, the same moment as before.
- Text fields, upsert responses, and app, table and field metadata are strings.
- Upserting a plain `Date` throws: use `QuickbaseDate.from(d)` for a Date field or `QuickbaseDateTime.from(d)` (or `d.toISOString()`) for a Date/Time field.
