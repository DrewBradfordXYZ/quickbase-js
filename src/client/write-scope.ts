/**
 * Write scope: limits a client's writes to what it names.
 *
 * A write whose target can be checked is allowed when the target is listed:
 * an app (and its tables), a solution or a group. A write that creates
 * something, or acts on the realm's users or your own credentials, is
 * allowed by a switch. Nothing is allowed unless it is named; reads are never
 * limited.
 *
 * A table's write is allowed when its table is in one of the scope's apps. To
 * tell, the client lists those apps' tables (getAppTables) the first time it
 * needs to, and again when it meets a table it hasn't seen; if that fails,
 * the write is refused. A relationship's parent table must be in scope too,
 * since QuickBase adds fields to it. An XML write is checked by its dbid (an
 * app or a table), or, for group actions, by its gid.
 */

import type { ResolvedConfig, WriteScopeState } from '../core/types.js';
import { WriteScopeError } from '../core/errors.js';
import { isXmlWriteAction } from '../xml/index.js';

/** What the write scope reads from QuickBase to judge a write. */
export interface ScopeLookups {
  /** An app's table IDs (getAppTables). */
  listTables: (appId: string) => Promise<string[]>;
  /** The parent table of a table's relationship (getRelationships). */
  relationshipParent: (childTableId: string, relationshipId: string) => Promise<string>;
}

type Refuse = (target: string, reason: string) => WriteScopeError;

const appPath = /^\/apps\/([^/]+)(\/copy)?$/i;
const trusteesPath = /^\/app\/([^/]+)\/trustees$/i;
const tablePath = /^\/tables\/([^/]+)(\/relationship(\/[^/]+)?)?$/i;
const fieldPath = /^\/fields(\/[^/]+)?$/i;
const filePath = /^\/files\/([^/]+)\//i;
const documentPath = /^\/docTemplates\/[^/]+\/generate$/i;
const solutionPath = /^\/solutions\/([^/]+)(\/fromrecord|\/torecord)?$/i;
const groupPath = /^\/groups\/([^/]+)\/(members|managers|subgroups)$/i;
const usersPath = /^\/users\/(deny|undeny)(\/[^/]+)?$/i;
const tokenPath = /^\/usertoken(\/(clone|transfer|deactivate))?$/i;

// XML write actions that aren't checked by their dbid
// XML actions in lower case: QuickBase matches action names without regard to case
const xmlGroupCreateActions = new Set(['api_creategroup', 'api_copygroup']);
const xmlGroupActions = new Set([
  'api_deletegroup',
  'api_addusertogroup',
  'api_removeuserfromgroup',
  'api_changegroupinfo',
  'api_addsubgroup',
  'api_removesubgroup',
]);
const xmlTokenActions = new Set(['api_signout']);
const xmlAppCreateActions = new Set(['api_createdatabase', 'api_clonedatabase']);
const xmlUserActions = new Set(['api_provisionuser']);
const xmlGid = /<gid\s*>\s*([A-Za-z0-9._-]+)\s*<\/gid\s*>/i;
// Any gid element, namespaced (<x:gid>) or not
const xmlGidOpen = /<([A-Za-z0-9._-]+:)?gid[\s/>]/gi;

/**
 * Refuse a JSON API write outside the client's write scope. `isWrite` is the
 * request flow's own test of whether the request can change data.
 */
export async function checkWriteScope(
  config: ResolvedConfig,
  request: {
    method: string;
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  },
  isWrite: boolean,
  lookups: ScopeLookups
): Promise<void> {
  const scope = config.writeScope;
  if (!scope || !isWrite) {
    return;
  }
  const method = request.method.toUpperCase();
  const path = request.path;
  const refuse: Refuse = (target, reason) => new WriteScopeError(method, path, reason, target || undefined);
  // IDs are checked exactly as they will be sent: aliases in the body and the
  // tableId parameter are resolved before this check, and a path is sent as
  // given, so resolving one here would check an ID that isn't sent
  const table = (id: unknown) => String(id ?? '');
  const requireTable = (id: string) => requireScopeTable(scope, id, refuse, lookups.listTables);
  // A key given twice in different letter cases is ambiguous: a server might read the other one
  const queryParam = (key: string): string => {
    const value = strictField(request.query, key);
    if (value === undefined) throw refuse('', `the ${key} parameter is ambiguous`);
    return value;
  };
  const bodyField = (key: string): string => {
    const value = strictField(request.body, key);
    if (value === undefined) throw refuse('', `the body's ${key} is ambiguous`);
    return value;
  };

  // Apps
  const is = (p: string) => path.toLowerCase() === p;
  if (method === 'POST' && is('/apps')) {
    return allow(scope.createApps, '', "creating apps isn't allowed", refuse);
  }
  let m = appPath.exec(path);
  if (m) {
    if (m[2]?.toLowerCase() === '/copy') return allow(scope.createApps, m[1] ?? '', "copying apps isn't allowed", refuse);
    return requireApp(scope, m[1] ?? '', refuse);
  }
  m = trusteesPath.exec(path);
  if (m) return requireApp(scope, m[1] ?? '', refuse);

  // Tables
  if (method === 'POST' && is('/tables')) {
    return requireApp(scope, queryParam('appId'), refuse);
  }
  m = tablePath.exec(path);
  if (m) {
    const appId = queryParam('appId');
    if (appId) requireApp(scope, appId, refuse);
    const child = table(m[1]);
    await requireTable(child);
    if (!m[2]) return;
    // A relationship adds lookup fields to its child table and summary
    // fields to its parent, so the parent must be in scope too
    if (!m[3]) {
      const parent = bodyField('parentTableId');
      if (!parent) throw refuse('', 'a relationship needs its parentTableId');
      return requireTable(table(parent));
    }
    let parent: string;
    try {
      parent = await lookups.relationshipParent(child, m[3].slice(1));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw refuse(child, `finding the relationship's parent table failed: ${message}`);
    }
    return requireTable(parent);
  }
  if (fieldPath.test(path)) return requireTable(table(queryParam('tableId')));
  if (is('/records')) {
    return requireTable(table(bodyField(method === 'DELETE' ? 'from' : 'to')));
  }
  m = filePath.exec(path);
  if (method === 'DELETE' && m) return requireTable(table(m[1]));
  if (documentPath.test(path)) return requireTable(table(queryParam('tableId')));

  // Solutions
  if ((method === 'POST' && is('/solutions')) || (method === 'GET' && is('/solutions/fromrecord'))) {
    return allow(scope.createSolutions, '', "creating solutions isn't allowed", refuse);
  }
  m = solutionPath.exec(path);
  if (m) {
    // Exporting to a record reads the solution and writes the record
    if (m[2]?.toLowerCase() === '/torecord') return requireTable(table(queryParam('tableId')));
    const id = m[1] ?? '';
    if (!scope.solutions.has(id)) throw refuse(id, 'solution is outside the write scope');
    return;
  }

  // Groups, users, credentials
  m = groupPath.exec(path);
  if (m) return requireGroup(scope, m[1] ?? '', refuse);
  if (usersPath.test(path)) return allow(scope.manageUsers, '', "managing users isn't allowed", refuse);
  if (tokenPath.test(path)) return allow(scope.manageTokens, '', "managing user tokens isn't allowed", refuse);

  throw refuse('', "this write isn't one the write scope knows");
}

/**
 * Refuse an XML API write action outside the write scope. Group actions are
 * checked by their gid, sign-out by manageTokens, and the rest by their dbid,
 * an app or a table.
 */
export async function checkXmlWriteScope(
  config: ResolvedConfig,
  dbid: string,
  action: string,
  body: string,
  write: boolean,
  lookups: ScopeLookups
): Promise<void> {
  const scope = config.writeScope;
  if (!scope || !(write || isXmlWriteAction(action))) {
    return;
  }
  const refuse: Refuse = (target, reason) =>
    new WriteScopeError('POST', `/db/${dbid}`, reason, target || undefined, action);
  const name = action.trim().toLowerCase();

  if (xmlGroupCreateActions.has(name)) {
    return allow(scope.createGroups, '', "creating groups isn't allowed", refuse);
  }
  if (xmlGroupActions.has(name)) {
    const gid = xmlGroupId(body);
    if (gid === undefined) throw refuse('', "the request's gid is missing or ambiguous");
    return requireGroup(scope, gid, refuse);
  }
  if (xmlTokenActions.has(name)) {
    return allow(scope.manageTokens, '', "signing out isn't allowed", refuse);
  }
  if (xmlAppCreateActions.has(name)) {
    return allow(scope.createApps, dbid, "creating apps isn't allowed", refuse);
  }
  if (xmlUserActions.has(name)) {
    allow(scope.manageUsers, '', "managing users isn't allowed", refuse);
    return requireApp(scope, dbid, refuse);
  }
  if (scope.apps.has(dbid)) return;
  await requireScopeTable(scope, dbid, refuse, lookups.listTables);
}

/**
 * An XML body's one <gid>, or undefined when there isn't exactly one, or the
 * body has a comment, CDATA or other markup declaration that could hide one
 * from this check but not from QuickBase.
 */
function xmlGroupId(body: string): string | undefined {
  if (body.includes('<!') || body.includes('<?')) return undefined;
  if ((body.match(xmlGidOpen) ?? []).length !== 1) return undefined;
  return xmlGid.exec(body)?.[1];
}

function allow(ok: boolean, target: string, reason: string, refuse: Refuse): void {
  if (!ok) throw refuse(target, reason);
}

function requireApp(scope: WriteScopeState, appId: string, refuse: Refuse): void {
  if (!appId) throw refuse('', 'no app ID in the request');
  if (!scope.apps.has(appId)) throw refuse(appId, 'app is outside the write scope');
}

function requireGroup(scope: WriteScopeState, gid: string, refuse: Refuse): void {
  if (!gid) throw refuse('', 'no group ID in the request');
  if (!scope.groups.has(gid)) throw refuse(gid, 'group is outside the write scope');
}

/**
 * Allow a table in one of the scope's apps. A table it hasn't seen sends it
 * to list the apps' tables again, once.
 */
async function requireScopeTable(
  scope: WriteScopeState,
  tableId: string,
  refuse: Refuse,
  listTables: ScopeLookups['listTables']
): Promise<void> {
  if (!tableId) throw refuse('', 'no table ID in the request');
  if (scope.tableApp.has(tableId)) return;
  if (scope.apps.size === 0) throw refuse(tableId, 'table is outside the write scope');

  try {
    // Requests that miss at the same time share one listing
    scope.loading ??= (async () => {
      try {
        const tableApp = new Map<string, string>();
        for (const appId of scope.apps) {
          for (const id of await listTables(appId)) {
            tableApp.set(id, appId);
          }
        }
        scope.tableApp = tableApp;
      } finally {
        scope.loading = undefined;
      }
    })();
    await scope.loading;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw refuse(tableId, `listing the write scope's tables failed: ${message}`);
  }
  if (!scope.tableApp.has(tableId)) throw refuse(tableId, 'table is outside the write scope');
}

/**
 * A string or number at `key` in a body or query ("" when absent), or
 * undefined when it is ambiguous: the key is also there in another letter
 * case ({ to, To }), or the value isn't a string or number.
 */
function strictField(source: unknown, key: string): string | undefined {
  if (source === undefined || source === null) return '';
  if (typeof source !== 'object' || Array.isArray(source)) return undefined;
  const record = source as Record<string, unknown>;
  const lower = key.toLowerCase();
  if (Object.keys(record).some((k) => k !== key && k.toLowerCase() === lower)) return undefined;
  const value = record[key];
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}
