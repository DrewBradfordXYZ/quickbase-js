# Rate limits and retries

QuickBase allows **100 JSON API requests per 10 seconds per user token** ([rate limiting](https://developer.quickbase.com/rateLimit)).

```typescript
createClient({
  realm: 'mycompany',
  auth: { type: 'user-token', userToken: 'token' },
  timeout: 30000,
  rateLimit: {
    proactiveThrottle: { enabled: true, requestsPer10Seconds: 100 },
    retry: { maxAttempts: 5, initialDelayMs: 1000, maxDelayMs: 30000, multiplier: 2 },
    onRateLimit: (info) => {
      console.log(`rate limited on ${info.requestUrl}; retry after ${info.retryAfter}s (ray ${info.qbApiRay})`);
    },
  },
});
```

| Option | Default | Does |
|---|---|---|
| `retry.maxAttempts` | 3 | Attempts in all, counting the first |
| `retry.initialDelayMs` | 1000 | The first backoff |
| `retry.multiplier` | 2 | Growth per attempt |
| `retry.maxDelayMs` | 30000 | The backoff cap |
| `proactiveThrottle` | off | At most `requestsPer10Seconds` in any 10 seconds |
| `timeout` | 30000 | Each request, in ms |

## What is retried

| Failure | Reads (GETs, and POSTs that read: `runQuery`, `runReport`, `runFormula`, ...) | Writes (upserts, creates, deletes, ...) |
|---|---|---|
| 429 | retried | retried: QuickBase didn't process it |
| 401 | retried once a temp token is refreshed | the same |
| Connection never opened (DNS, refused) | retried (`NetworkError`) | retried: it wasn't sent |
| Timeout, 5xx, connection lost | retried (`TimeoutError`, `ServerError`, `NetworkError`) | **not retried**: thrown |

A write that timed out or got a 502 may have been applied, and sending it again could, for example, add an upsert's records twice. Check what happened (query for the records) before sending it again. XML API calls follow the same rules, with write actions as writes.

A 429 or a retried failure is retried until the attempts run out. The wait is QuickBase's `Retry-After` when it sends one; otherwise `initialDelayMs × multiplier^(attempt−1)`, ±10% jitter, capped at `maxDelayMs`. `onRateLimit` runs on each 429 before the wait. When the attempts run out, a 429 throws `RateLimitError` (`retryAfter`, and `rateLimitInfo` with QuickBase's ray IDs for support requests).

Retries recover from a 429; the throttle avoids it, waiting before any request that would exceed the window.

## Cancelling

`withSignal` gives a client whose requests stop when an `AbortSignal` aborts, including requests waiting to retry. They reject with the signal's reason.

```typescript
const controller = new AbortController();
const records = qb.withSignal(controller.signal).runQuery({ from: tableId }).all();
controller.abort(); // records rejects; nothing more is sent
```

## Values QuickBase rejects

An upsert whose values QuickBase rejects (a date in the wrong form, text in a numeric field) still saves the records, with those fields blank, and answers 207. The rejections are in `metadata.lineErrors`, keyed by each record's 1-based position. `throwOnLineErrors: true` makes them a `LineErrorsError`, whose `response` keeps the IDs of the records that were saved:

```typescript
const qb = createClient({ realm, auth, throwOnLineErrors: true });
try {
  await qb.upsert({ to: tableId, data });
} catch (error) {
  if (error instanceof LineErrorsError) {
    console.log(error.lineErrors, error.response);
  }
}
```
