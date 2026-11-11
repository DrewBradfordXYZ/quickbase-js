# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Generated from QuickBase's current spec**: types now come from the OpenAPI 3 that QuickBase's API portal publishes (the spec repo's `fetch-upstream`), not a December 2025 Swagger 2.0 copy.
- **`getUserApps`** (`GET /users/{userId}/apps`), and the `alias` parameter on `createSolution` and `createSolutionFromRecord`.
- **Response properties the spec omitted**, found by comparing live responses with the spec: field `summaryQuery` (a summary field's filter), `primaryKey`, `masterTableId` (a reference field's parent table), `masterTableKeyFid`, `fieldCaching`, `openTargetIn`; field usage `customEmails` and `documentTemplates`; report `incomplete` and `query.fields`, `query.sortBy`, `query.groupBy`; `ancestorId` on `createApp` and more on `updateSolution` and `getSolutionPublic`.
- **Typed report `properties`**: table, chart, summary and map settings (`columnProperties`, `chartType`, `summarize`, ...). The type keeps its `[key: string]: unknown` index signature, so `props['key']` reads still compile.
- Methods whose parameters are all optional and whose body is required also take the body alone: `createSolution(body)` alongside `createSolution({ alias }, body)`, and the same for `denyUsers` and `undenyUsers`.

### Fixed
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
