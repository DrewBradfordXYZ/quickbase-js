# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
