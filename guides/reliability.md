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

A 429 or a 5xx is retried until the attempts run out. The wait is QuickBase's `Retry-After` when it sends one; otherwise `initialDelayMs × multiplier^(attempt−1)`, ±10% jitter, capped at `maxDelayMs`. `onRateLimit` runs on each 429 before the wait. When the attempts run out, a 429 throws `RateLimitError` (`retryAfter`, and `rateLimitInfo` with QuickBase's ray IDs for support requests).

Retries recover from a 429; the throttle avoids it, waiting before any request that would exceed the window.
