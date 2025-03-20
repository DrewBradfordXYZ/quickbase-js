# quickbase-js

This is a Typescript library using the QuickBase OpenAPI spec and the typescipt-fetch generator. This library is designed for both browser and Node.js environments. Code pages have first class support.

Authentication methods: `Temporary Tokens`, `User Tokens`, `SSO`.

# Installation

```bash
npm install --save quickbase-js
```

## Examples

### CDN Code Page

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Quickbase</title>
    <script src="https://cdn.jsdelivr.net/npm/quickbase-js@1.1.0-beta.6/dist/umd/quickbase.umd.min.js"></script>
  </head>

  <body>
    <div>
      <h1>Quickbase-js CDN Example</h1>
      <p id="result">Loading...</p>
    </div>
    <script>
      var realm = "xxxxxxxxxxxxxxxxxxxx"; // replace with your realm
      var appId = "xxxxxxxxxxxxxxxxxxxx"; // replace with your app ID
      if (typeof QuickbaseJS === "undefined") {
        document.getElementById("result").textContent =
          "Error: Failed to load QuickbaseJS library.";
      } else {
        var qbClient = QuickbaseJS.quickbase({
          realm,
          useTempTokens: true,
        });

        qbClient
          .getApp({ appId })
          .then(function (app) {
            document.getElementById("result").textContent =
              "App Name: " + app.name;
          })
          .catch(function (err) {
            document.getElementById("result").textContent =
              "Error: " + (err.message || "Failed to load app");
          });
      }
    </script>
  </body>
</html>
```

## Configuration

The `quickbase` function accepts a `QuickbaseConfig` object with the following options:

- **`realm`** (`string`): Your QuickBase realm (e.g., "company"). This is required and has no default value.
- **`userToken`** (`string`, optional): A QuickBase user token for authentication. No default is provided.
- **`useTempTokens`** (`boolean`, optional): Enables temporary token authentication. Defaults to `false`.
- **`useSso`** (`boolean`, optional): Enables SSO authentication. Defaults to `false`.
- **`samlToken`** (`string`, optional): A SAML token for SSO authentication. No default is provided.

---

_Optional advanced options:_

- **`tempTokenLifespan`** (`number`, optional): The lifespan (in milliseconds) of temporary tokens in the cache. Defaults to `290000` (290 seconds).
- **`throttle`** (`{ rate: number; burst: number }`, optional): Configures rate limiting, where `rate` is requests per second and `burst` is the maximum burst of requests. Defaults to `{ rate: 10, burst: 10 }`.
- **`maxRetries`** (`number`, optional): The maximum number of retries for failed requests. Defaults to `3`.
- **`retryDelay`** (`number`, optional): The base delay (in milliseconds) between retries, which increases exponentially. Defaults to `1000`.
- **`convertDates`** (`boolean`, optional): Converts ISO date strings to `Date` objects in responses. Defaults to `true`.
- **`baseUrl`** (`string`, optional): The base URL for the QuickBase API. Defaults to `"https://api.quickbase.com/v1"`.
- **`tempToken`** (`string`, optional): A temporary token for authentication. No default is provided.
- **`tokenCache`** (`TokenCache`, optional): A custom token cache instance. Defaults to a new `TokenCache` instance created with `tempTokenLifespan`.
- **`fetchApi`** (`typeof fetch`, optional): A custom fetch implementation (e.g., for Node.js). Defaults to the browser’s `fetch` if available, or the provided implementation.
- **`debug`** (`boolean`, optional): Enables debug logging to the console. Defaults to `false`.

### Configuration Notes

- **Authentication**: Use `userToken` for standard auth, `tempToken` with `useTempTokens` for temporary tokens, or `samlToken` with `useSso` for SSO. Only one auth method is active at a time.
- **`throttle`**: Controls API request pacing to avoid hitting rate limits. For example, `{ rate: 5, burst: 20 }` allows 5 requests per second with a burst capacity of 20.
- **`tokenCache`**: If not provided, a new cache is initialized automatically, storing temporary tokens for the specified `tempTokenLifespan`.
- **`fetchApi`**: In Node.js, you must provide a fetch implementation (e.g., `node-fetch`), as there’s no built-in `fetch` like in browsers.

### Development workflow

```bash
npm run gen:all
npm run build
npm run test:all
```

### Prerequisites

Node.js >= 18

npm >= 8

A Quickbase app with a table and a user token. A free builder account works with must API calls.

### Contributing

1. Fork the repository.

2. Create a feature branch (git checkout -b feature/your-feature).

3. Commit changes (git commit -m "Add your feature").

4. Push to your branch (git push origin feature/your-feature).

5. Open a pull request.

### License

MIT License - see LICENSE for details.
