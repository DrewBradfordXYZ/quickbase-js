# QuickBase JS SDK v2 - Project Guide

This document provides context for AI assistants working on this codebase.

## Project Overview

**quickbase-js** is a TypeScript/JavaScript client library for the QuickBase JSON RESTful API. v2 is a clean rewrite focusing on:

- Proper rate limiting based on official QuickBase documentation
- Clean OpenAPI spec processing pipeline
- **Multi-language architecture** (designed for future Go SDK)
- Language-agnostic test fixtures
- Strict TypeScript with no `any` types in core code

## Multi-Language Strategy

This SDK is designed to support multiple language implementations from a single source of truth.

### Design Principles

1. **OpenAPI Spec is the Source of Truth**
   - Both TypeScript and Go clients generate from the same spec
   - Schema fixes live in `spec/overrides/`, not in language-specific code
   - Run `openapi-generator -g typescript-fetch` or `-g go` on the same spec

2. **Language-Agnostic Test Fixtures**
   - Fixtures are JSON files, not language-specific mocks
   - Same fixtures load in TypeScript (`loadFixture()`) and Go (`loadFixture()`)
   - Test scenarios (auth retry, pagination) defined in JSON

3. **Minimal Hand-Written Code**
   - Generated code in `src/generated/` (or `generated/` in Go) - never edit
   - Hand-written wrapper is small (~500 lines per language)
   - Patterns translate directly between languages

4. **Portable Configuration**
   - Config structures are JSON-serializable
   - Same config schema works across languages

### Shared vs Language-Specific

| Component | Shared | Language-Specific |
|-----------|--------|-------------------|
| OpenAPI spec | ✅ | - |
| Schema overrides | ✅ | - |
| Test fixtures (JSON) | ✅ | - |
| Fixture loader | Pattern shared | Implement per language |
| Generated API types | - | Generate per language |
| Auth strategies | Pattern shared | Implement per language |
| Retry/throttle logic | Pattern shared | Implement per language |
| HTTP client wrapper | - | ~300-500 lines per language |

### Future Go SDK Structure

```
quickbase-go/
├── spec/                    # Symlink or copy from quickbase-js/v2/spec
│   ├── fixtures/            # Same JSON fixtures
│   └── output/              # Same generated spec
├── generated/               # openapi-generator -g go output
├── client/
│   ├── auth.go              # Auth strategies (same patterns as TS)
│   ├── retry.go             # Retry logic (same patterns as TS)
│   ├── throttle.go          # Throttle logic (same patterns as TS)
│   └── client.go            # Main client factory
└── client_test.go           # Uses same fixtures!
```

### Go Equivalent Patterns

**TypeScript:**
```typescript
interface AuthStrategy {
  getToken(dbid?: string): Promise<string>;
  getAuthorizationHeader(token: string): string;
  handleAuthError(dbid?: string): Promise<boolean>;
}
```

**Go:**
```go
type AuthStrategy interface {
    GetToken(ctx context.Context, dbid string) (string, error)
    GetAuthorizationHeader(token string) string
    HandleAuthError(ctx context.Context, dbid string) (bool, error)
}
```

### When Adding Features

Always ask: "How would this work in Go?"

- ✅ JSON-serializable config
- ✅ Interface-based abstractions
- ✅ Fixtures in JSON files
- ❌ TypeScript-specific decorators
- ❌ Runtime type manipulation
- ❌ Language-specific test frameworks in fixtures

## QuickBase API Rate Limits

**Critical**: These limits come from official QuickBase documentation.

| Limit | Value | Source |
|-------|-------|--------|
| RESTful API | **100 requests per 10 seconds per user token** | Official docs |
| General traffic | 10-15 requests/sec to apps | Official docs |
| XML API (legacy) | 10 requests/sec/table | Official docs |

### Rate Limit Handling

1. **Check `Retry-After` header first** - If present, use it
2. **Retry only for**:
   - HTTP 429 (rate limited)
   - HTTP 500, 502, 503, 504 (server errors)
3. **Do NOT retry HTTP 400** - Bad request won't succeed on retry
4. **Use exponential backoff** with jitter

### Headers to Capture for Debugging

- `Retry-After` - Seconds to wait before retry
- `qb-api-ray` - QuickBase API ray ID
- `cf-ray` - Cloudflare ray ID
- `tid` - Transaction ID

## Architecture

```
v2/
├── src/
│   ├── core/           # Types, errors, config, logging
│   ├── auth/           # Authentication strategies
│   ├── client/         # Request execution, retry, throttling
│   ├── generated/      # (Future) Generated from OpenAPI spec
│   └── index.ts        # Main entry point
│
├── spec/
│   ├── tools/          # CLI for spec processing
│   ├── overrides/      # Schema fixes (YAML/JSON)
│   ├── output/         # Generated specs
│   └── fixtures/       # Test fixtures (JSON)
│
└── tests/
    ├── helpers/        # Test utilities
    ├── unit/           # Unit tests (mocked)
    └── integration/    # (Future) Real API tests
```

## Authentication Strategies

### 1. User Token (`user-token`)
- Simplest method
- Token passed directly in `Authorization: QB-USER-TOKEN {token}`
- Cannot be refreshed - 401 is permanent failure

### 2. Temporary Token (`temp-token`)
- Database-specific tokens fetched from `/auth/temporary/{dbid}`
- Cached with TTL (~4m50s, tokens expire at 5m)
- Can be refreshed on 401
- **Auto dbid extraction**: SDK automatically extracts dbid from request parameters:
  - `body.from` (runQuery, deleteRecords)
  - `body.to` (upsert)
  - `query.tableId` (getFields, etc.)
  - `query.appId` (getAppTables, etc.)
  - Path segments `/tables/{tableId}` and `/apps/{appId}`
- **Code Page support**: Uses `credentials: 'include'` for token fetch to leverage browser session cookies
- **CORS handling**: API calls use `credentials: 'omit'` to avoid CORS issues

### 3. SSO Token (`sso`)
- Exchanges SAML token for QuickBase temp token
- Uses OAuth token exchange endpoint
- Global token (not per-dbid)

## Key Design Decisions

### Rate Limiting Strategy
**Decision**: Server-side handling by default, optional client-side throttling.

**Rationale**: QuickBase handles rate limiting server-side and returns `Retry-After` headers. Client-side throttling is optional for users who want to avoid 429s proactively.

```typescript
// Default: No client-side throttling, just handle 429s
createClient({ realm: 'x', auth: {...} });

// Optional: Proactive client-side throttling
createClient({
  realm: 'x',
  auth: {...},
  rateLimit: {
    proactiveThrottle: {
      enabled: true,
      requestsPer10Seconds: 100, // Matches QB limit
    },
  },
});
```

### Error Classes
**Decision**: Typed error classes instead of generic errors.

```typescript
QuickbaseError        // Base class
├── RateLimitError    // 429 - includes retryAfter, rateLimitInfo
├── AuthenticationError // 401
├── AuthorizationError  // 403
├── NotFoundError       // 404
├── ValidationError     // 400 - includes field errors
├── TimeoutError        // Request timeout
└── ServerError         // 5xx
```

### Logging
**Decision**: Logger class that respects `debug` flag. Never log tokens.

```typescript
// Good - respects debug flag
logger.debug('Token cache hit', { dbid });

// Bad - never do this
console.log('Token:', token);
```

### Test Fixtures
**Decision**: Language-agnostic JSON fixtures for future Go SDK compatibility.

```
spec/fixtures/
├── apps/get-app/
│   ├── response.200.json  # Success response
│   ├── response.401.json  # Auth failure
│   └── response.429.json  # Rate limited
└── _sequences/
    └── auth-retry.json    # Multi-request scenarios
```

Fixture format:
```json
{
  "_meta": {
    "description": "Description of this fixture",
    "status": 200,
    "headers": { "Retry-After": "5" }
  },
  "body": { /* actual response */ }
}
```

## OpenAPI Spec Pipeline

The original QuickBase spec has issues that need fixing:

1. **Swagger 2.0** - Convert to OpenAPI 3.0
2. **Internal headers** - Remove QB-Realm-Hostname, Authorization (SDK handles these)
3. **Loose typing** - Many `any` types, arrays typed as strings
4. **Missing schemas** - Some responses lack proper definitions

### Spec Tools

```bash
npm run spec:convert   # Swagger 2.0 → OpenAPI 3.0
npm run spec:patch     # Apply fixes from overrides/
npm run spec:validate  # Check for errors
npm run spec:split     # Split by tag (for AI editing)
npm run spec:build     # Full pipeline
```

### Override System

Put schema fixes in `spec/overrides/`:

```yaml
# spec/overrides/schemas.yaml
GetFields200Response:
  type: array
  items:
    $ref: '#/components/schemas/Field'
```

## Code Conventions

### File Naming
- `kebab-case.ts` for files
- `PascalCase` for classes and interfaces
- `camelCase` for functions and variables

### Imports
- Use `.js` extensions for relative imports (ESM compatibility)
- Group imports: external, then internal, then types

```typescript
import { readFileSync } from 'fs';

import { QuickbaseError } from '../core/errors.js';
import type { AuthStrategy } from './types.js';
```

### Error Handling
- Always use typed error classes
- Include ray IDs when available
- Never swallow errors silently

```typescript
// Good
throw new AuthenticationError(message, { rayId });

// Bad
catch (e) { /* ignore */ }
```

### Async/Await
- Prefer async/await over .then() chains
- Always handle promise rejections

## Testing Conventions

### Unit Tests
- Use fixtures from `spec/fixtures/`
- Mock fetch with `createTrackedMockFetch()`
- Test error scenarios, not just happy paths

```typescript
import { loadResponse, createTrackedMockFetch } from '../helpers/fixtures.js';

it('should handle rate limiting', async () => {
  const fixture = loadResponse('apps', 'get-app', 429);
  const { fetch, getCalls } = createTrackedMockFetch([fixture]);
  // ...
});
```

### No Real API Calls in Unit Tests
Unit tests must never call the real QuickBase API. Use fixtures exclusively.

### Integration Tests (Future)
Will be in `tests/integration/` and require `.env` with real credentials.

## Common Tasks

### Adding a New Endpoint

1. Add fixture in `spec/fixtures/{domain}/{operation}/`
2. If spec needs fixing, add override in `spec/overrides/`
3. Run `npm run spec:build` to regenerate
4. Add unit tests

### Adding a New Auth Strategy

1. Create `src/auth/{strategy-name}.ts`
2. Implement `AuthStrategy` interface
3. Add to factory in `src/auth/index.ts`
4. Add config type to `src/core/types.ts`
5. Add tests

### Debugging Rate Limits

```typescript
const client = createClient({
  // ...
  debug: true,
  rateLimit: {
    onRateLimit: (info) => {
      console.log('Rate limit info:', {
        retryAfter: info.retryAfter,
        qbApiRay: info.qbApiRay,
        cfRay: info.cfRay,
      });
    },
  },
});
```

## Known Issues / TODOs

- [ ] Need to complete OpenAPI 3.0 spec conversion
- [ ] Generate TypeScript client from spec
- [ ] Add pagination support
- [ ] Add more fixtures for all endpoints
- [ ] Diagnostic warnings about `yaml` module - install with `npm install`

## Links

- [QuickBase API Portal](https://developer.quickbase.com/)
- [Rate Limiting Overview](https://help.quickbase.com/docs/rate-limiting-overview)
- [Limits in QuickBase](https://help.quickbase.com/hc/en-us/articles/4570306993940)
- [Original v1 codebase](../) - Reference for feature parity
