# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
