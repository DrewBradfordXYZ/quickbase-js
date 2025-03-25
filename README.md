# quickbase-js

A Typescript API client for the [Quickbase JSON RESTful API](https://developer.quickbase.com/).

Support for various authentication types (`user token`, `temporary tokens`, `SSO token`), `concurrent rate limiting strategies`, `auto pagination`, `js date conversion`, `429` (rate limit) and `401` (auth) error handling retries. It uses a Proxy to dynamically invoke API methods derived from the OpenAPI specification.

Browser and Node.js support. ESM and UMD builds are available.

Authentication and throttle methods are opinionated. See configuration options for details and available settings.

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

- **`throttle`** (`{ type?: 'flow' | 'burst-aware';` `rate?: number;` `burst?: number;` `windowSeconds?: number }`, optional): Configures concurrent rate limiting to manage API request throughput. Defaults to `{ type: 'flow', rate: 5, burst: 50 }`.

  - **`type`** (`string`): Throttle strategy. _Setting type without rate or burst enables default settings for that throttle type._

    - `'flow'` (default): Uses `FlowThrottleBucket` for a QuickBase-agnostic burst-then-rate flow. Ideal for steady request pacing.

    - `'burst-aware'`: Uses `BurstAwareThrottleBucket` for QuickBase-specific burst throttling with a sliding window (e.g., 100 requests per 10 seconds). Ideal for when you need to use nearly all your allotted API calls immediately, for example on page load.

  _Set rate and burst if changing defaults._

  - **`rate`** (`number`): Requests per second after the initial burst (for `'flow'` only). Default is `5`. Meaning 5 request tokens get created each second.

  - **`burst`** (`number`): Maximum concurrent requests:
    - For `'flow'`: Initial concurrent burst size (default: 50), followed by `rate`/sec.
    - For `'burst-aware'`: Concurrent burst cap per window (default: 100), waits for window reset if exceeded.
  - **`windowSeconds`** (`number`, `'burst-aware'` only): Sliding window duration in seconds (default: 10). Caps total requests (e.g., 100 requests available every 10s).

  - **Examples**:
    - `{ type: 'flow', rate: 5, burst: 50 }`: **~10s for 100 requests**, (50 instant, and 1 every 200ms. In other words, 50 at 10/sec).
    - `{ type: 'burst-aware', burst: 100, windowSeconds: 10 }`: **~10s for 100 requests**, (100 instant, refreshing every 10s for next burst).

- **`maxRetries`** (`number`, optional): Maximum retries for failed requests. Defaults to `3`.

- **`retryDelay`** (`number`, optional): Base delay (in milliseconds) between retries, increases exponentially. Defaults to `1000`.

- **`tempTokenLifespan`** (`number`, optional): Lifespan (in milliseconds) of temporary tokens in the cache. Defaults to 4 minutes 50 seconds (290000 ms).

- **`convertDates`** (`boolean`, optional): Converts ISO date strings to `Date` objects in responses. Defaults to `true`.

- **`autoPaginate`** (`boolean`, optional): Enables automatic pagination of multi-page API responses. Defaults to `true`.

### Overrides and Development Options

- **`fetchApi`** (`typeof fetch`, optional): Defaults to built-in `fetch` in browsers and Node.js >= 18. In older Node.js versions, node-fetch or another compatible library via fetchApi is required.

- **`baseUrl`** (`string`, optional): Base URL for the QuickBase API. Defaults to `"https://api.quickbase.com/v1"`.

- **`debug`** (`boolean`, optional): Enables debug logging to the console. Defaults to `false`.

- **`tempToken`** (`string`, optional): Overrides default tempToken behavior by providing your own token.

- **`tokenCache`** (`TokenCache`, optional): Allows use of a custom token cache instance.

---

#### Configuration Notes

- **Authentication**: Three mutually exclusive methods: `userToken`, `useTempTokens`, and `useSso` with `samlToken`. Only one may be active at a time.
- **`tokenCache`**: Temporary tokens are cached here with their `dbid` and `tempTokenLifespan` when `useTempTokens` is enabled.

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
