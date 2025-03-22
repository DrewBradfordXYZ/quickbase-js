# quickbase-js

A Typescript API client for the [Quickbase JSON RESTful API](https://developer.quickbase.com/).

Support for various authentication strategies (`user token`, `temporary tokens`, `SSO token`), `rate limiting`, `429` and `401` error handling retries and automatic `date` conversion. It uses a Proxy to dynamically invoke API methods derived from the OpenAPI specification.

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

_User options:_

- **`realm`** (`string`): Your QuickBase realm (e.g., "company"). This is required and has no default value.
- **`userToken`** (`string`, optional): A QuickBase user token for authentication. No default is provided.
- **`useTempTokens`** (`boolean`, optional): Enables temporary token authentication. Defaults to `false`.
- **`useSso`** (`boolean`, optional): Enables SSO authentication. Defaults to `false`.
- **`samlToken`** (`string`, optional): A SAML token for SSO authentication. No default is provided.

_Advanced user options:_

- **`throttle`** (`{ rate: number; burst: number }`, optional): Configures rate limiting, where `rate` is requests per second and `burst` is the maximum burst of requests. Defaults to `{ rate: 10, burst: 10 }`.

- **`maxRetries`** (`number`, optional): The maximum number of retries for failed requests. Defaults to `3`.

- **`retryDelay`** (`number`, optional): The base delay (in milliseconds) between retries, which increases exponentially. Defaults to `1000`.

- **`tempTokenLifespan`** (`number`, optional): The lifespan (in milliseconds) of temporary tokens in the cache. Defaults to 4 minutes 50 seconds (290000 ms).

- **`convertDates`** (`boolean`, optional): Converts ISO date strings to `Date` objects in responses. Defaults to `true`.

_Overrides and development options:_

- **`fetchApi`** (`typeof fetch`, optional): For browser environments, this defaults to the built-in `fetch`. In Node.js, you are able to use `node-fetch` or another compatible library.

- **`baseUrl`** (`string`, optional): The base URL for the QuickBase API. Defaults to `"https://api.quickbase.com/v1"`.

- **`debug`** (`boolean`, optional): Enables debug logging to the console. Defaults to `false`.

- **`tempToken`** (`string`, optional): If you would like to override the default behavior of tempTokens you can provide your own tempToken.

- **`tokenCache`** (`TokenCache`, optional): If you would like to use your own token cache, you can provide an instance of `TokenCache`.

---

#### Configuration Notes

- **Authentication**: There are three mutually exclusive authentication methods: `userToken`, `useTempTokens` and `useSso` with `samlToken`. Only one auth method may be active at a time.

- **`throttle`**: Adjust this to handle 429 Too Many Requests errors. Controls API request pacing to avoid hitting rate limits. For example, `{ rate: 5, burst: 20 }` allows 5 requests per second with a burst capacity of 20.

- **`tokenCache`**: Temporary tokens are cached with their dbid with a `tempTokenLifespan`. This is automatically setup for you when `useTempTokens` is enabled.

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
