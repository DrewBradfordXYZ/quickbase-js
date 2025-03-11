# quickbase-js

## Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Quickbase Test</title>
  </head>

  <body>
    <div>
      <h1>Quickbase Test</h1>
      <p id="result">Loading...</p>
    </div>
    <script type="module">
      import { quickbase } from "quickbase-js";
      // Initalize the QuickBase client
      const qb = quickbase({
        realm: "your-realm", // Replace with actual QuickBase realm
        // ------------------------------
        // Authentication Options
        // ----------------------------
        // OPTION 1: User Token Authentication
        // - Use this if you have a QuickBase user token (get it from "My Profile" > "Manage User Tokens")
        // - Works in Node.js or browsers, ideal for standalone apps or testing outside QuickBase
        // - Uncomment the line below and replace with your token; comment out 'useTempTokens'
        // userToken: "your-user-token",

        // ----------------------------
        // OPTION 2: Temporary Token Authentication
        // - Use this for QuickBase code pages, leveraging the browser’s authenticated session
        // - No user token needed; requires running in a QuickBase browser context
        // - Uncomment the line below and comment out 'userToken' if using this option
        // useTempTokens: true,
      });

      // Fetch the app
      qb.getApp({ appId: "your-app-id" }) // Replace with actual app ID
        .then((app) => {
          document.getElementById(
            "result"
          ).textContent = `App Name: ${app.name}`;
        })
        .catch((err) => {
          console.error("Error fetching app:", err);
          document.getElementById("result").textContent =
            err.message || "Failed to load app";
        });
    </script>
  </body>
</html>
```

# Development workflow

```bash
npm run fix-spec
npm run regenerate
npm run generate-unified
npm run build
npm run test
npm run test:pw:qb:all
```

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

"Temporary tokens require a browser environment or a custom fetchApi with browser-like session support"

How It Works: Temp tokens need a browser session with cookies, which Node.js can’t provide natively. A custom fetchApi (e.g., via Puppeteer) could work but is impractical for typical Node.js use.

Practicality: Effectively unusable in Node.js without external browser support, aligning with QuickBase’s temp token requirement.

## getTempTokenDBID

Temporary Token Handling with getTempTokenDBID
The QuickBase API provides the getTempTokenDBID method to fetch temporary tokens (QB-TEMP-TOKEN) for browser-based authentication, typically using session credentials (e.g., cookies). These tokens are short-lived (~5 minutes) and intended for secure, client-side API calls. In the generated OpenAPI client, getTempTokenDBID makes a straightforward GET request to /v1/auth/temporary/{dbid} and returns { temporaryAuthorization: string }. However, this raw implementation lacks caching and doesn’t optimize repeated calls, which can lead to unnecessary API requests.
In quickbaseClient.ts, we enhance getTempTokenDBID when useTempTokens: true is enabled, wrapping it with intelligent token management:
Caching: We introduce a TokenCache to store temporary tokens by dbid. Before fetching a new token, the client checks the cache. If a valid token exists, it’s returned immediately, avoiding redundant API calls.

Custom Fetch Logic: Instead of relying solely on the generated method, we use a custom fetchTempToken function to fetch tokens. This ensures consistency with browser-based session authentication (credentials: "include") and allows us to cache the result.

Early Returns: For getTempTokenDBID, we bypass the generated method’s execution by returning the cached or freshly fetched token directly. This prevents unnecessary calls to the underlying API when the token is already available or just retrieved.

Why This Matters
Efficiency: Caching reduces API requests, crucial for performance in browser environments where temp tokens are fetched frequently but don’t change within their lifespan.

Seamless Integration: The wrapper supports both QB-USER-TOKEN (server-side) and QB-TEMP-TOKEN (client-side) workflows, controlled by the useTempTokens config. This makes the client versatile for different use cases.

Testability: The enhancement fixes issues in unit tests (e.g., getTempToken.test.ts) by ensuring predictable behavior—fetching once and reusing cached tokens—avoiding unexpected errors from redundant calls.

How It Works
When you call client.getTempTokenDBID({ dbid: "someDbid" }) with useTempTokens: true:
Cache Check: Looks for an existing token in tokenCache for the given dbid.

Fetch if Needed: If no cached token exists, fetchTempToken requests a new one from /v1/auth/temporary/{dbid} and caches it.

Return Early: Returns { temporaryAuthorization: token } immediately, skipping the generated method’s execution.

For other methods (e.g., getFields), the fetched temp token is applied to the Authorization header, ensuring authenticated API calls without re-fetching.

## 401 Unauthorized Error Behavior

The quickbase-js library manages 401 Unauthorized errors from the QuickBase API when using temporary tokens (useTempTokens: true). Normally, it keeps tokens fresh via a time-managed cache intending to never have a 401 Unauthorized error, but there is added safety measures incase a 401 happens to occur.

If a 401 happens, the library tries once more with a fresh temporary token.

It gets the new token using fetchTempToken and retries the call.

If the retry fails with another 401, it stops and throws an error like API Error: Unauthorized (Status: 401).

Fetching a New Token:
If fetchTempToken itself gets a 401 (e.g., no valid login session), it doesn’t retry.

It throws an error right away: API Error: Unauthorized (Status: 401).

Why It’s Like This
One Retry: Retries once to fix expired tokens, but stops to avoid endless tries.

Fast Fail: No retry on fetchTempToken 401s means you know quickly if login is broken.

No Loops: Built to never get stuck retrying forever.
