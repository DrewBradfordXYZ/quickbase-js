# quickbase-js

A Typescript API client for the [Quickbase JSON RESTful API](https://developer.quickbase.com/).

Support for various authentication strategies (`user token`, `temporary tokens`, `SSO token`), `rate limiting`, `429`(rate limit) error and `401`(auth) error handling retries and automatic `date` conversion. It uses a Proxy to dynamically invoke API methods derived from the OpenAPI specification.

Browser and Node.js support. ESM and UMD builds are available.

Authentication methods are handled in an opinionated manner. See configuration options for details and available settings.

## API Documentation

<a href="https://quickbase-js.netlify.app/" target="_blank"> Documentation</a> for quickbase-js.

## Installation

#### Node.js install

```bash
npm install --save quickbase-js
```

#### CDN install.

Find and select the latest version. UMD is recommended for code pages.

<a href="https://www.jsdelivr.com/package/npm/quickbase-js?tab=files" target="_blank">CDN Files</a> for quickbase-js

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Quickbase</title>
    <!-- Replace xx.xx.xx with the latest version from CDN Files-->
    <script src="https://cdn.jsdelivr.net/npm/quickbase-js@xx.xx.xx/dist/umd/quickbase.umd.min.js"></script>
  </head>
  <body>
    <script>
      const realm = ""; // Replace with your realm
      const appId = ""; // Replace with your app ID

      const qb = QuickbaseJS.quickbase({
        realm,
        useTempTokens: true,
      });

      qb.getApp({ appId })
        .then((app) => console.log(app.name))
        .catch((err) => console.log(err.message));
    </script>
  </body>
</html>
```

## Authentication Examples

### User Token

```javascript
import { quickbase } from "quickbase-js"; // Adjust the import path as needed

// QuickBase config variables
const QB_REALM = ""; // Your QuickBase realm (e.g., 'mycompany')
const QB_USER_TOKEN = ""; // Your QuickBase user token (e.g., 'b12345_abcde...')
const QB_APP_ID = ""; // Your app ID (e.g., 'bxyz789')

const qb = quickbase({
  realm: QB_REALM,
  userToken: QB_USER_TOKEN,
});

const getAppDetails = async () => {
  try {
    const response = await qb.getApp({
      appId: QB_APP_ID,
    });
    console.log("App Details:", response);
  } catch (error) {
    console.error("Error fetching app:", error.message);
  }
};

getAppDetails();
```

### Temporary Tokens (Code Pages)

```javascript
import { quickbase } from "quickbase-js"; // Adjust the import path as needed

// QuickBase config variables
const QB_REALM = ""; // Your QuickBase realm (e.g., 'mycompany')
const QB_APP_ID = ""; // Your app ID (e.g., 'bxyz789')

const qb = quickbase({
  realm: QB_REALM,
  useTempTokens: true,
});

const getAppDetails = async () => {
  try {
    const response = await qb.getApp({
      appId: QB_APP_ID,
    });
    console.log("App Details:", response);
  } catch (error) {
    console.error("Error fetching app:", error.message);
  }
};

getAppDetails();
```

### SSO Token

```javascript
import { quickbase } from "quickbase-js"; // Adjust the import path as needed

// QuickBase config variables
const QB_REALM = ""; // Your QuickBase realm (e.g., 'mycompany')
const QB_SAML_TOKEN = ""; // Your SAML token (e.g., 'saml_xyz789...')
const QB_APP_ID = ""; // Your app ID (e.g., 'bxyz789')

const qb = quickbase({
  realm: QB_REALM,
  samlToken: QB_SAML_TOKEN,
  useSso: true,
});

const getAppDetails = async () => {
  try {
    const response = await qb.getApp({
      appId: QB_APP_ID,
    });
    console.log("App Details:", response);
  } catch (error) {
    console.error("Error fetching app:", error.message);
  }
};

getAppDetails();
```

## Configuration

The `quickbase` function accepts a `QuickbaseConfig` object with the following options:

### User Options

- **`realm`** (`string`): Your QuickBase realm (e.g., "company"). This is required and has no default value.
- **`userToken`** (`string`, optional): A QuickBase user token for authentication. No default is provided.
- **`useTempTokens`** (`boolean`, optional): Enables temporary token authentication. Defaults to `false`.
- **`useSso`** (`boolean`, optional): Enables SSO authentication. Defaults to `false`.
- **`samlToken`** (`string`, optional): A SAML token for SSO authentication. No default is provided.

### Advanced User Options

- **`throttle`** (`{ type?: 'flow' | 'burst-aware'; rate?: number; burst?: number; windowSeconds?: number }`, optional): Configures rate limiting to manage API request throughput. Defaults to `{ type: 'flow', rate: 6, burst: 50 }`.
  - **`type`**: Throttle strategy:
    - `'flow'` (default): Uses `FlowThrottleBucket` for a Quick Base-agnostic burst-then-rate flow. Ideal for steady request pacing across any API.
    - `'burst-aware'`: Uses `BurstAwareThrottleBucket` for Quick Base-specific burst throttling with a sliding window (e.g., 100 requests per 10 seconds).
  - **`rate`** (`number`): Requests per second after the initial burst (for `'flow'` only). Default is `5`. Over 10 seconds, this allows ~50 requests with default burst.
  - **`burst`** (`number`): Maximum concurrent requests:
    - For `'flow'`: Initial burst size (default: 50), followed by `rate`/sec.
    - For `'burst-aware'`: Burst cap per window (default: 50), waits for window reset if exceeded.
  - **`windowSeconds`** (`number`, `'burst-aware'` only): Sliding window duration in seconds (default: 10). Caps total requests (e.g., 100 in 10s for QuickBase).
  - **Examples**:
    - `{ type: 'flow', rate: 10, burst: 50 }`: ~6s for 100 requests (50 instant, 50 at 10/sec).
    - `{ type: 'burst-aware', burst: 100, windowSeconds: 10 }`: ~1s for 100 requests, waits 10s for next burst.
- **`maxRetries`** (`number`, optional): Maximum retries for failed requests. Defaults to `3`.
- **`retryDelay`** (`number`, optional): Base delay (in milliseconds) between retries, increases exponentially. Defaults to `1000`.
- **`tempTokenLifespan`** (`number`, optional): Lifespan (in milliseconds) of temporary tokens in the cache. Defaults to 4 minutes 50 seconds (290000 ms).
- **`convertDates`** (`boolean`, optional): Converts ISO date strings to `Date` objects in responses. Defaults to `true`.

### Overrides and Development Options

- **`fetchApi`** (`typeof fetch`, optional): For browser environments, defaults to built-in `fetch`. In Node.js, use `node-fetch` or another compatible library.
- **`baseUrl`** (`string`, optional): Base URL for the QuickBase API. Defaults to `"https://api.quickbase.com/v1"`.
- **`debug`** (`boolean`, optional): Enables debug logging to the console. Defaults to `false`.
- **`tempToken`** (`string`, optional): Overrides default tempToken behavior by providing your own token.
- **`tokenCache`** (`TokenCache`, optional): Allows use of a custom token cache instance.

---

#### Configuration Notes

- **Authentication**: Three mutually exclusive methods: `userToken`, `useTempTokens`, and `useSso` with `samlToken`. Only one may be active at a time.
- **`tokenCache`**: Temporary tokens are cached with their `dbid` and `tempTokenLifespan` when `useTempTokens` is enabled.
- **Throttling**:
  - Default `FlowThrottleBucket` (`rate: 5`, `burst: 50`) provides steady request throttling. 10 seconds enables 100 requests, balancing burst and flow across APIs calls, ideal for general use.
  - Optional `BurstAwareThrottleBucket` optimizes for QuickBase’s theoretical 100 burst requests every 10 seconds limit. Ideal for scenarios where your initial page load requires many API calls. However, you may use up all available requests quickly, causing delays in subsequent requests. If you exceed the burst limit, requests will be queued until the next window resets potentially causing long percieved waits. Check for `429` errors and handle accordingly.

---

### Development workflow

```bash
npm run gen:all
npm run build
npm run test:all
```

---

### Prerequisites

- Node.js version >= 18
- A Quickbase account. [Free tier available](https://www.quickbase.com/builder-program).

---

### Contributing

If you would like to contribute to this project, please fork the repository and submit a pull request.

---

### License

MIT License - see LICENSE for details.

---
