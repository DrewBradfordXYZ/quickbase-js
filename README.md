# quickbase-js

# Development workflow

```bash
npm run fix-spec
npm run regenerate
npm run generate-unified
npm run build
npm run test
npm run test:integration
```

`useTempTokens: true` is browser-only (QuickBase code pages).

`userToken` works in both browser and Node.js with `fetchApi`.

## In QuickBase Code Pages (Browser Environment)

### useTempTokens: true:

Token Fetch: Auto-fetches temporary tokens using the provided fetchApi (or window.fetch by default) with cookies (withCredentials: true in the internal tokenClient).

Subsequent Calls (e.g., getApp): Uses the same fetchApi (or window.fetch) with the QB-TEMP-TOKEN {TOKEN} header. No additional config needed beyond realm and useTempTokens.

How It Works: Leverages the browser’s session cookies for the initial token fetch, then uses the token for all API calls. In a real code page, window.fetch handles both steps seamlessly.

Test Output: The test uses page.evaluate for token fetch and node-fetch for getApp to bypass Playwright’s browser fetch issue, but in a code page, it’s all window.fetch.

### userToken:

All Calls: Uses the provided fetchApi (or window.fetch by default) with the QB-USER-TOKEN {TOKEN} header. No session cookies needed (credentials: "omit").

How It Works: The user token authenticates directly, independent of the browser session, making it straightforward and reliable.

Test Output: Confirms this with page.evaluate sending QB-USER-TOKEN.

## In Node.js (Non-Browser Environment)

### userToken:

All Calls: Works with a provided fetchApi (e.g., fetchApi: node-fetch). Sets QB-USER-TOKEN {TOKEN} header.

How It Works: Fully functional as long as fetchApi is supplied (e.g., node-fetch), since user tokens don’t require a browser session.

Requirement: Must provide fetchApi explicitly (no default in Node.js).

### useTempTokens: true:

Behavior: Fails with a clear error unless a browser-like fetchApi is provided:

```
"Temporary tokens require a browser environment or a custom fetchApi with browser-like session support"
```

How It Works: Temp tokens need a browser session with cookies, which Node.js can’t provide natively. A custom fetchApi (e.g., via Puppeteer) could work but is impractical for typical Node.js use.

Practicality: Effectively unusable in Node.js without external browser support, aligning with QuickBase’s temp token requirement.
