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

Node.js Compatibility Revisited
Your Question
If someone asks, "Can I use Node.js with this project?"

Answer Based on Change
Change Recap: Removed node-fetch default, uses window.fetch if available, or requires a provided fetchApi. All calls stay in the fetchApi context (browser assumed for useTempTokens: true).

Implications:
With useTempTokens: true: No, you can’t use Node.js directly. The temporary token fetch requires a browser session with cookies, which Node.js can’t provide natively. You’d need a browser (or Playwright) to fetch the token first, then pass it as tempToken to a Node.js client, but that’s not the auto-fetching intent.

With userToken: Yes, it works in Node.js. If you provide a userToken and a fetchApi (e.g., node-fetch), all calls use QB-USER-TOKEN and don’t need a browser session.

Without Tokens: No, unless a browser-like fetchApi is provided, as the default now assumes window.fetch.

Definitive Answer: "You can use this library in Node.js with permanent user tokens (userToken) and a fetch implementation like node-fetch. However, for temporary tokens (useTempTokens: true), it’s designed for browser environments like QuickBase code pages, as the token fetch requires a logged-in browser session. Node.js alone can’t fetch temp tokens without external browser support."
