# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **ownerId type mismatch**: Updated spec submodule to handle `ownerId` being returned as either a string or integer from the QuickBase API. Personal reports return `ownerId` as a string, while shared reports return it as an integer.

### Technical Details

The QuickBase API spec defines `ownerId` as `integer`, but the actual API returns:
- **String** for personal reports: `{ "ownerId": "12345678" }`
- **Integer** for shared reports: `{ "ownerId": 12345678 }`

The spec submodule now patches this to accept any type. In TypeScript, `ownerId` is typed as `string | number | undefined`.

**Affected endpoints**: `getTableReports`, `getReport`

### Migration

If you were assuming `ownerId` is always a number:

```typescript
// Before
const ownerId: number = report.ownerId!;

// After - handle both types
const ownerId = typeof report.ownerId === 'string'
  ? parseInt(report.ownerId, 10)
  : report.ownerId;
```

## [2.2.2] - Previous Release

See git history for prior changes.
