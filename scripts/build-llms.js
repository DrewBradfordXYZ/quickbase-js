#!/usr/bin/env node
// Writes llms.txt and llms-full.txt (https://llmstxt.org) into docs/, the
// TypeDoc site, and copies the README and guides there as Markdown so the
// links in llms.txt resolve on the site. Run after typedoc (npm run docs).

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

const SITE = 'https://drewbradfordxyz.github.io/quickbase-js';
const OUT = 'docs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const operations = JSON.parse(readFileSync('src/generated/operations.json', 'utf8'));
const client = readFileSync('src/generated/client.ts', 'utf8');

const guides = [
  ['queries.md', 'Queries, pagination and records', 'runQuery, runReport, .all() and .paginate(), upserts and deletes'],
  ['schema-aliases.md', 'Schema aliases', 'table and field names instead of IDs, and the schema generator'],
  ['authentication.md', 'Authentication', 'user tokens, temporary tokens in code pages, tickets and SSO'],
  ['reliability.md', 'Rate limits and retries', 'throttling, retry and backoff settings, timeouts'],
  ['xml-api.md', 'The XML API', 'roles, groups, code pages, app variables, webhooks and CSV imports'],
  ['migration.md', 'Migrating from v1', 'changes from the v1 API of this package'],
];

// Each generated method's JSDoc starts with QuickBase's summary.
const summaries = new Map();
for (const m of client.matchAll(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*\n\s*(\w+)\(/g)) {
  const first = m[1].split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).find(Boolean);
  if (first) summaries.set(m[2], first);
}

const byTag = new Map();
for (const op of operations) {
  const tag = op.tags?.[0] ?? 'Other';
  if (!byTag.has(tag)) byTag.set(tag, []);
  byTag.get(tag).push(op);
}

function methodList() {
  const lines = [];
  for (const [tag, ops] of byTag) {
    lines.push(`### ${tag}`, '');
    for (const op of ops) {
      const args = [op.hasParams && 'params', op.hasBody && 'body'].filter(Boolean).join(', ');
      const summary = summaries.get(op.operationId);
      lines.push(`- \`qb.${op.operationId}(${args})\`: ${op.method} ${op.path}${summary ? `. ${summary}` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

const intro = `# quickbase-js

> ${pkg.description}. Also: table and field names instead of IDs, typed errors, a read-only mode, no dependencies. For Node.js 18+, browsers and QuickBase code pages. Install with \`npm install quickbase-js\`; in a code page, load https://cdn.jsdelivr.net/npm/quickbase-js@2/dist/quickbase.min.js.

Create a client with \`createClient({ realm, auth })\`, where realm is the subdomain of realm.quickbase.com and auth is \`{ type: 'user-token', userToken }\` on a server or \`{ type: 'temp-token' }\` in a code page. Methods take path and query parameters first, then the request body. Records map a field ID to \`{ value }\` unless the client has a schema. Current version: ${pkg.version}.
`;

const llms = `${intro}
## Docs

- [README](${SITE}/README.md): install, quick start, code pages and common tasks
${guides.map(([file, title, desc]) => `- [${title}](${SITE}/guides/${file}): ${desc}`).join('\n')}

## API

- [Methods](${SITE}/llms-full.txt): every method with its HTTP endpoint, in the full file
- [API reference](${SITE}/interfaces/QuickbaseAPI.html): parameters and response types
- [QuickBase API documentation](https://developer.quickbase.com/)

## Optional

- [Code page examples](https://github.com/DrewBradfordXYZ/quickbase-js/tree/main/examples/codepages): a read-only activity feed code page in plain JavaScript, Preact, React, Vue and Angular
- [CHANGELOG](https://github.com/DrewBradfordXYZ/quickbase-js/blob/main/CHANGELOG.md)
`;

const full = [
  intro,
  '## Methods',
  '',
  methodList(),
  readFileSync('README.md', 'utf8'),
  ...guides.map(([file]) => readFileSync(`guides/${file}`, 'utf8')),
].join('\n');

mkdirSync(`${OUT}/guides`, { recursive: true });
copyFileSync('README.md', `${OUT}/README.md`);
for (const [file] of guides) copyFileSync(`guides/${file}`, `${OUT}/guides/${file}`);
writeFileSync(`${OUT}/llms.txt`, llms);
writeFileSync(`${OUT}/llms-full.txt`, full);
console.log(`llms.txt and llms-full.txt: ${operations.length} methods, ${guides.length} guides`);
