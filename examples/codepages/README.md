# QuickBase Code Page Examples

These examples demonstrate using the QuickBase JS SDK in Code Pages with various frameworks.

## Examples

| Example | Framework | Bundle Size | Description |
|---------|-----------|-------------|-------------|
| [vanilla/](./vanilla/) | Web Components | 0KB | No framework, pure custom elements |
| [alpine/](./alpine/) | Alpine.js | ~15KB | Declarative in HTML, no build step |
| [lit/](./lit/) | Lit | ~5KB | Lightweight web components |
| [preact/](./preact/) | Preact | ~3KB | React API, tiny footprint |
| [solid/](./solid/) | Solid | ~7KB | Fine-grained reactivity |
| [react/](./react/) | React | ~40KB | React 18 with hooks |
| [vue/](./vue/) | Vue 3 | ~34KB | Composition API |

## What They Do

Each example is an **App Explorer** that:

1. Auto-detects the realm and app ID from the Code Page URL
2. Discovers all tables in the app
3. Shows fields for each table (with types and properties)
4. Displays sample records with relative timestamps
5. Demonstrates proper error handling

No QuickBase setup required - just point at any app!

## How to Use

### Option 1: Copy HTML to Code Page

1. Open your QuickBase app
2. Go to **Settings > Code Pages**
3. Create a new Code Page
4. Copy the contents of any example's `index.html`
5. Save and view the page

### Option 2: Link to CDN (Development)

For development, you can link to the SDK via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/quickbase-js@2/dist/quickbase.min.js"></script>
```

## Authentication

All examples use **temp-token** authentication, which:

- Automatically gets tokens for each table
- Uses your existing QuickBase session (no login needed)
- Works seamlessly in Code Pages

## Patterns Demonstrated

### Shared Client Context

Each framework shows how to share a single client instance:

| Framework | Pattern |
|-----------|---------|
| **Vanilla** | Global singleton object |
| **Alpine** | Global `QB` object, component functions |
| **Lit** | Lit Context protocol (`@lit/context`) |
| **Preact** | `createContext` + `useContext` hook |
| **Solid** | `createContext` + `useContext` |
| **React** | React Context + `useContext` hook |
| **Vue** | `provide` / `inject` |

### Lazy Loading

All examples lazy-load table details - fields and records are only fetched when you expand a table card.

### Error Handling

Examples demonstrate handling:

- Rate limiting (429) with retry
- Authentication errors (401)
- Network failures
- Validation errors

### Loading States

Each example shows proper loading state management:

- Spinners while fetching
- Error messages
- Empty states

## Choosing a Framework

| If you want... | Use |
|----------------|-----|
| Smallest bundle, no framework | **Vanilla** |
| Easy HTML-first approach | **Alpine** |
| Web components with reactivity | **Lit** |
| React API, minimal size | **Preact** |
| Best performance, React-like | **Solid** |
| Full React ecosystem | **React** |
| Vue ecosystem | **Vue** |

For Code Pages specifically, **Alpine** or **Preact** are excellent choices - small bundles, no build step, and familiar patterns.

## File Structure

```
codepages/
├── README.md
├── code-page-test.html   # Basic SDK test page
├── vanilla/
│   └── index.html
├── alpine/
│   └── index.html
├── lit/
│   └── index.html
├── preact/
│   └── index.html
├── solid/
│   └── index.html
├── react/
│   └── index.html
└── vue/
    └── index.html
```

## Notes

- All examples are single HTML files for easy Code Page deployment
- They use CDN imports (no build step required)
- Each is ~250-350 lines including styles
- Production apps should bundle dependencies for better performance

## Customization

To adapt these for your app:

1. Change the field IDs in queries to match your schema
2. Add your own components for specific record types
3. Implement create/update/delete operations
4. Add caching for better performance
