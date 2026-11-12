# Code page examples: "What changed?"

A live activity feed for a QuickBase app, written five ways: plain JavaScript, Preact, React, Vue and Angular. Paste any one into a code page and it shows the latest records created or updated across every table in the app, newest first.

- **Everyone / Just me**: everyone's changes, or only yours
- **Filter by table**, and click a change to open the record
- **Refreshes every minute**; new changes wait behind a "2 new changes" banner instead of moving the list under you
- Tables you can't read are listed as "No access", not treated as errors

It works in any app with nothing to configure, because it only reads the fields every QuickBase table has: Date Created (1), Date Modified (2), Record ID# (3) and Last Modified By (5).

## Read-only

The client is created with `readOnly: true`, so it refuses every write before sending it. You can paste these into any app, and anything you build from them can't change records until you remove that line.

## Use one

1. In your app, go to **Settings > Code pages** and create a code page.
2. Paste the contents of one `index.html`.
3. Save, and open the page.

No build step, no token: the client uses temporary tokens from the signed-in user's session, so every call has that user's permissions.

| Example | Loads | Notes |
|---|---|---|
| [vanilla](vanilla/index.html) | nothing else | Plain DOM; the smallest |
| [preact](preact/index.html) | Preact + htm (one file, ~13 KB) | Hooks, JSX-like templates without a compiler |
| [react](react/index.html) | React 19 + htm | Same component as Preact, with `className` |
| [vue](vue/index.html) | Vue 3 | Template in the HTML, Composition API |
| [angular](angular/index.html) | Angular 22 with its compiler | Signals; the heaviest, since templates compile in the browser |

## How they're built

Each file has the same two parts:

1. **The QuickBase script**, identical in all five. It creates the client, runs one query per table (the 5 latest changes, sorted by Date Modified), merges them into one feed, and turns errors into messages: `AuthorizationError` and `AuthenticationError` for a table you can't read, `RateLimitError` when QuickBase is busy.
2. **The page script**, the only part that differs: state, rendering and a one-minute timer, in each framework's usual style.

To make it your own, change the query in `loadFeed`: pick other fields, add a `where`, or point it at one table. The page code doesn't need to change.

Large apps make one query per table; `proactiveThrottle` keeps them under QuickBase's limit of 100 requests per 10 seconds.
