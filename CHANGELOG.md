# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **`writeScope`**: a client may write only to what it names; any other write throws a `WriteScopeError` before it is sent. Lists: `appIds` (an app and every table in it, found with `getAppTables`), `solutionIds`, `groupIds`. Switches: `createApps`, `createSolutions`, `createGroups`, `manageUsers`, `manageTokens`. Reads are never limited, and `readOnly` wins over a scope.
- **`WriteBlockedError`**: the base class of `ReadOnlyError` and `WriteScopeError`.
- `scripts/check-spec.sh`: `npm run spec:generate` and `spec:build` stop when the `spec` submodule is behind the commit this repo records.

### Changed
- **Read-only mode fails closed, and can't be bypassed through the XML client.** It is checked where every XML request passes, so `createXmlClient(qb, { readOnly: false })` and `qb.requestXml(...)` no longer get around it. An XML action counts as a write unless it is known to only read (any letter case; `isXmlWriteAction('API_DeleteDatabase')` is now true); every HTTP method but GET, HEAD and OPTIONS is a write; methods and write endpoints match without regard to letter case. Refused when guarded: a path a server could read as another path (`..`, `\`, `%`, `?`, `#`, `//` or a trailing slash), a method-override header, a header naming another realm or host, a query value that isn't plain, an object body with `bodyType`, and an XML dbid that isn't a plain ID. A body is checked and sent as one plain JSON copy.
- **`getConfig()` returns a frozen copy**, so read-only mode and the write scope can't be changed after the client is created.
- **Typed methods URL-encode path parameters**, so an ID stays one path segment.
- A refused write's message ends by saying the refusal is intentional and not to retry it or send it another way.

### Fixed
- With a schema, list responses (`getAppTables`, `getFields`, ...) came back as objects keyed `"0"`, `"1"`, ... They are lists again.
- `changesetSolution` and `recordsModifiedSince` are reads: read-only mode refused them.

## [3.1.0] - 2026-11-12

### Added
- **Results and upserts typed from the schema.** `npx quickbase-js schema` now records each field's QuickBase type (`{ id: 12, type: 'date' }`, with `mode` for formula, lookup and summary fields) and writes the schema `as const satisfies Schema`. With it, `createClient({ schema })` types `runQuery`, `runReport` and `upsert` by table and field name: a query's result has exactly the selected fields, each typed (`string`, `number | null`, `QuickbaseDate | ''`, `QuickbaseUser | null`, ...); an upsert takes writable fields with values of the right type. A misspelled field, a value of the wrong type, a plain `Date`, or a write to a formula, lookup or summary field is a compile error. Types for each field type, blanks included, were checked against a live realm. See [the schema guide](guides/schema-aliases.md#typed-results).
- Schemas in the older form (fields as bare IDs) work as before, and `--merge` turns them into the typed form, keeping your aliases.

### Fixed
- **`runReport` with a schema sent the table alias to QuickBase**: the alias was resolved to pick a temp token, but the URL kept `tableId=projects`. It now sends the table ID.
- `upsert`'s `fieldsToReturn` and `mergeFieldId` take field aliases, resolved like `select`.

## [3.0.0] - 2026-11-12

Dates change type, writes stop retrying after failures that may have been applied, and XML API calls share the JSON API's retries and errors. See [guides/dates.md](guides/dates.md) (with an upgrade section) and [guides/reliability.md](guides/reliability.md).

### Added
- **`withSignal(signal)`**: a client whose requests, and retry waits, stop when the `AbortSignal` aborts; they reject with its reason.
- **`throwOnLineErrors: true`**: an upsert whose values QuickBase rejects throws `LineErrorsError` (`lineErrors`, and `response` with the saved records' IDs). QuickBase saves those records with the rejected fields blank and answers 207; without the option the rejections are only in `metadata.lineErrors`.
- **`NetworkError`** for a request that got no answer (DNS, a refused or lost connection); `neverSent` says whether the connection opened. Reads are retried after one; fetch's raw `TypeError` was thrown and never retried.
- ESLint with typescript-eslint's recommended rules; CI runs `npm run lint` (the script existed, but neither ESLint nor a config did).

### Changed
- **BREAKING: Date and Date/Time fields are typed by field, not guessed from the string.** 2.x turned every string that looked like a date into a `Date`. A Date field's `"2024-01-15"` became UTC midnight, which shows Jan 14 anywhere west of UTC; Text fields holding a date became Dates; and a Date field read and written back was sent as a timestamp, which QuickBase rejects, leaving the field blank. Now, in query and report results, by the field types QuickBase sends with them:
  - Date fields are `QuickbaseDate`: a `Date` at local midnight, so `getDate()` and `toLocaleDateString()` give the stored day in any time zone, in a browser or on a server. It serializes as `"2024-01-15"` (and `String(date)` is the same), so it keeps its day across time zones and upserts back as the only form a Date field accepts; `toLocaleDateString()` shows the day whatever `timeZone` option it is given; and a day that doesn't exist (`2024-02-30`) is a `RangeError`, not March 1.
  - Date/Time fields are `QuickbaseDateTime`, the same moment as before.
  - Everything else stays as QuickBase sends it: Text, Time of Day, blank dates (`""`), upsert responses (which carry no field types), and app, table and field metadata (`created`, `updated`).
- **BREAKING: upserting a plain `Date` throws**, before anything is sent, naming the field. A Date field accepts only `"2024-01-15"` and a Date/Time field only a timestamp, so a `Date` has to say which it is: `QuickbaseDate.from(d)`, `QuickbaseDate.today()`, `QuickbaseDateTime.from(d)` or `QuickbaseDateTime.current()`, or the string. TypeScript refuses a plain `Date` in upsert data too.
- **BREAKING:** `transformDates` and `isIsoDateString` are removed. `convertDates: false` still keeps the strings.
- **BREAKING: writes retry only after a 429.** An upsert or other write that timed out or got a 5xx may have been applied, and sending it again could add its records twice. Writes still retry after a 429 (QuickBase didn't process it), after a 401 with a refreshed token, and when the connection never opened. Reads, including `runQuery` and `runReport` (POSTs), retry after timeouts, 5xx and network errors.
- **BREAKING: XML API calls go through the client's request path**: its auth, proactive throttle, timeout, retries (write actions as writes) and errors. A 429 or 5xx was a plain `Error`, with no retry and no throttle; it is now `RateLimitError` or `ServerError`. `createXmlClient` needs a client from this version's `createClient` (it uses the client's `requestXml`).
- Removed internal helpers that nothing used: a second retry loop (`executeWithRetry`), `getRetryDelay`, `isRetryableStatus` and `isRetryableError`.


### Fixed
- **Read-only mode let two solution writes through**: `updateSolutionToRecord` (`GET /solutions/{id}/fromrecord`, which changes apps) and `exportSolutionToRecord` (`GET /solutions/{id}/torecord`, which writes a record) are GETs, and only `/solutions/fromrecord` was blocked. Both now throw `ReadOnlyError`. `changesetSolutionFromRecord` only reads and is still allowed.
- **A 401 never fetched a new token**: the retry loop gave up on errors that aren't retryable before reaching the token refresh, and a 401 isn't one. An expired or revoked temp token now gets one new token and one retry; a user token's 401 still fails at once.

## [2.4.1] - 2026-11-12

### Fixed
- **`require('quickbase-js')` in browser bundles** returned the code-page bundle, which only sets a global, so `createClient` was `undefined`. The `browser` entries are gone: bundlers use the ES module for both `import` and `require`, and `exports` has a `default` condition, so `require` also works in Node 20.19+ and 22.12+. CDN links without a file path still serve `dist/quickbase.min.js` (`unpkg` and `jsdelivr` fields).
- **Source maps** pointed to `src/`, which wasn't published; the package now includes it, so debuggers and "Go to definition" reach the TypeScript source.
- `types` comes first in `exports`, as TypeScript requires, and `"sideEffects": false` lets bundlers drop unused code.

### Changed
- README rewritten around common tasks; the docs site publishes `llms.txt` and `llms-full.txt`.

## [2.4.0] - 2026-11-12

### Added
- **Generated from QuickBase's current spec**: types now come from the OpenAPI 3 that QuickBase's API portal publishes (the spec repo's `fetch-upstream`), not a December 2025 Swagger 2.0 copy.
- **`getUserApps`** (`GET /users/{userId}/apps`), and the `alias` parameter on `createSolution` and `createSolutionFromRecord`.
- **Response properties the spec omitted**, found by comparing live responses with the spec: field `summaryQuery` (a summary field's filter), `primaryKey`, `masterTableId` (a reference field's parent table), `masterTableKeyFid`, `fieldCaching`, `openTargetIn`; field usage `customEmails` and `documentTemplates`; report `incomplete` and `query.fields`, `query.sortBy`, `query.groupBy`; `ancestorId` on `createApp` and more on `updateSolution` and `getSolutionPublic`.
- **Typed report `properties`**: table, chart, summary and map settings (`columnProperties`, `chartType`, `summarize`, ...). The type keeps its `[key: string]: unknown` index signature, so `props['key']` reads still compile.
- Methods whose parameters are all optional and whose body is required also take the body alone: `createSolution(body)` alongside `createSolution({ alias }, body)`, and the same for `denyUsers` and `undenyUsers`.

### Fixed
- **Plain upsert values without a schema**: `{ '6': 'Alpha' }` was wrapped in `{ value }` only when the client had a schema; without one it went to QuickBase as given and was rejected. Values are now always wrapped.
- **Types for aliases and plain values**: `select`, `groupBy` and `sortBy` field IDs accept aliases (`number | string`), and upsert records accept plain values (`UpsertRecord`), matching what the client already accepted at runtime. Results stay typed by field ID.
- **Ticket password kept after a failed sign-in**: the password was cleared only when sign-in succeeded, so after a failure it stayed in memory and the next call sent it again. It is now cleared as soon as the sign-in request is sent; a later call says to create a new client.
- **Solutions and file downloads**: QBL is YAML and file content isn't JSON, but both went through `JSON.stringify` and `response.json()`, so `exportSolution`, `downloadFile` and `generateDocument` failed on success and the solution create/update/changeset calls sent JSON. They now return text, and send QBL as `application/x-yaml` (`RequestOptions` gains `bodyType` and `responseType: 'text'`).

### Changed
- **BREAKING (types only)**: `createSolution`, `updateSolution` and `changesetSolution` take the QBL as a `string`; `updateSolution`'s body is required; `exportSolution` and `downloadFile` resolve to `string`.
- **BREAKING (types only)**: `runReport` takes no body (the API never read one).
- **BREAKING (types only)**: fields QuickBase marks required are required: `transferUserToken`'s `id`, `from` and `to`, upsert's `data`, and app variables' `name` and `value`.

## [2.3.0] - 2026-03-02

### Added
- **Granular Error Handling**: Introduced specialized error classes (`QuickbaseTicketError`, `QuickbaseAppTokenError`, `QuickbaseXmlError`) for more descriptive failure states.
- **Improved Exports**: The `checkError` utility is now exported from the top-level package for advanced XML error handling.

### Fixed
- **XML Error Alignment**: Re-aligned internal error codes (`InvalidTicket`, `Unauthorized`, `InvalidAppToken`) with the official Quickbase Documentation.
- **getAppDTMInfo without auth**: `API_GetAppDTMInfo` takes no authentication, and QuickBase rejected it with "User Tokens cannot be used to call this API". It is now sent without credentials.
- **ownerId type mismatch**: `ownerId` on `getTableReports` and `getReport` is `string | number | undefined`. QuickBase returns a string for personal reports (`"12345678"`) and an integer for shared ones (`12345678`), though its spec says integer. If you assumed a number: `typeof report.ownerId === 'string' ? parseInt(report.ownerId, 10) : report.ownerId`.

### Removed
- **Legacy v1 Implementation**: The `v1/` directory and all associated proxy-based logic have been removed to reduce package size and maintenance overhead.

## [2.2.2] - Previous Release

See git history for prior changes.
