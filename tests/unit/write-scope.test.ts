/**
 * Write scope unit tests: writes outside the scope never reach the server.
 */

import { describe, it, expect } from 'vitest';
import { createClient, createXmlClient, WriteScopeError, ReadOnlyError, WriteBlockedError } from '../../src/index.js';
import type { WriteScope } from '../../src/core/types.js';

/**
 * A fake QuickBase with two apps: "appin" (tables "tin1", "tin2") and
 * "appout" (table "tout1"). It answers getAppTables and records every
 * other request that reaches it.
 */
function scopeServer() {
  const tables: Record<string, string[]> = { appin: ['tin1', 'tin2'], appout: ['tout1'] };
  // child table -> relationship ID -> parent table
  const relationships: Record<string, Record<number, string>> = { tin2: { 10: 'tout1', 11: 'tin1' } };
  const writes: string[] = [];
  const urls: string[] = [];
  const state = { listCalls: 0, listFails: false };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const fetchApi = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(typeof input === 'string' ? input : input.toString());
    const method = init?.method ?? 'GET';
    const path = url.pathname.replace(/^\/v1/, '');
    const rel = /^\/tables\/([^/]+)\/relationships$/.exec(path);
    if (method === 'GET' && rel) {
      const rels = Object.entries(relationships[rel[1] ?? ''] ?? {}).map(([id, parentTableId]) => ({
        id: Number(id),
        parentTableId,
      }));
      return json({ relationships: rels, metadata: { totalRelationships: rels.length } });
    }
    if (method === 'GET' && path === '/tables') {
      state.listCalls++;
      if (state.listFails) return json({ message: 'Access denied' }, 403);
      return json((tables[url.searchParams.get('appId') ?? ''] ?? []).map((id) => ({ id })));
    }
    writes.push(`${method} ${path}`);
    urls.push(url.toString());
    if (url.hostname.endsWith('quickbase.com') && path.startsWith('/db/')) {
      return new Response('<qdbapi><errcode>0</errcode></qdbapi>', { status: 200 });
    }
    return json({});
  };
  return { fetchApi: fetchApi as typeof fetch, tables, writes, urls, state };
}

function scopedClient(server: ReturnType<typeof scopeServer>, writeScope: WriteScope, readOnly = false) {
  return createClient({
    realm: 'testrealm',
    auth: { type: 'user-token', userToken: 'token' },
    fetchApi: server.fetchApi,
    rateLimit: { retry: { maxAttempts: 1 } },
    writeScope,
    readOnly,
  });
}

async function refused(name: string, call: () => Promise<unknown>) {
  await expect(call(), name).rejects.toBeInstanceOf(WriteScopeError);
}

// Fails when either setting refused the call. Tests also count the requests
// that reached the server, so an allowed call that never left is caught.
async function allowed(name: string, call: () => Promise<unknown>) {
  try {
    await call();
  } catch (err) {
    expect(err, name).not.toBeInstanceOf(WriteBlockedError);
  }
}

describe('Write scope', () => {
  it("allows writes to the scope's apps and their tables", async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });

    await allowed('createField', () => qb.createField({ tableId: 'tin1' }, { label: 'Priority', fieldType: 'text' }));
    await allowed('deleteFields', () => qb.deleteFields({ tableId: 'tin2' }, { fieldIds: [7] }));
    await allowed('upsert', () => qb.upsert({ to: 'tin1', data: [] }));
    await allowed('deleteRecords', () => qb.deleteRecords({ from: 'tin2', where: '{3.GT.0}' }));
    await allowed('createTable', () => qb.createTable({ appId: 'appin' }, { name: 'New' }));
    await allowed('updateApp', () => qb.updateApp({ appId: 'appin' }, {}));
    await allowed('updateTable', () => qb.updateTable({ tableId: 'tin1', appId: 'appin' }, {}));
    await allowed('createRelationship', () =>
      qb.createRelationship({ tableId: 'tin2' }, { parentTableId: 'tin1' })
    );

    expect(s.writes).toHaveLength(8);
    expect(s.state.listCalls).toBe(1); // cached
  });

  it('refuses everything else before sending it', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });

    await refused('createField outside the scope', () => qb.createField({ tableId: 'tout1' }, { label: 'X', fieldType: 'text' }));
    await refused('deleteFields outside the scope', () => qb.deleteFields({ tableId: 'tout1' }, { fieldIds: [7] }));
    await refused('upsert outside the scope', () => qb.upsert({ to: 'tout1', data: [] }));
    await refused('deleteRecords outside the scope', () => qb.deleteRecords({ from: 'tout1', where: '{3.GT.0}' }));
    await refused('createTable outside the scope', () => qb.createTable({ appId: 'appout' }, { name: 'New' }));
    await refused('updateApp outside the scope', () => qb.updateApp({ appId: 'appout' }, {}));
    await refused('deleteApp outside the scope', () => qb.deleteApp({ appId: 'appout' }, { name: 'Out' }));
    await refused('updateTable table outside the scope under an in-scope appId', () =>
      qb.updateTable({ tableId: 'tout1', appId: 'appin' }, {})
    );
    await refused('relationship whose parent is outside the scope', () =>
      qb.createRelationship({ tableId: 'tin1' }, { parentTableId: 'tout1' })
    );
    await refused('deleteFile outside the scope', () =>
      qb.deleteFile({ tableId: 'tout1', recordId: 1, fieldId: 6, versionNumber: 0 })
    );

    // No app to check
    await refused('createApp', () => qb.createApp({ name: 'New' }));
    await refused('copyApp', () => qb.copyApp({ appId: 'appin' }, { name: 'Copy' }));
    await refused('denyUsers', () => qb.denyUsers(['u1']));
    await refused('addMembersToGroup', () => qb.addMembersToGroup({ gid: 1 }, ['u1']));
    await refused('cloneUserToken', () => qb.cloneUserToken({}));
    await refused('updateSolution', () => qb.updateSolution({ solutionId: 'sol1' }, 'qbl'));

    expect(s.writes).toEqual([]);
  });

  it('leaves reads alone', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: [] });
    await allowed('getFields outside the scope', () => qb.getFields({ tableId: 'tout1' }));
    await allowed('runQuery outside the scope', () => qb.runQuery({ from: 'tout1' }));
    expect(s.writes).toHaveLength(2);
  });

  it('refuses every write with an empty scope, without listing tables', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: [] });
    await refused('createField', () => qb.createField({ tableId: 'tin1' }, { label: 'X', fieldType: 'text' }));
    expect(s.state.listCalls).toBe(0);
    expect(s.writes).toEqual([]);
  });

  it('allows creating and copying apps with createApps', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: [], createApps: true });
    await allowed('createApp', () => qb.createApp({ name: 'New' }));
    await allowed('copyApp', () => qb.copyApp({ appId: 'appout' }, { name: 'Copy' }));
    await refused('updateApp with only createApps', () => qb.updateApp({ appId: 'appout' }, {}));
    expect(s.writes).toHaveLength(2);
  });

  it('finds a table created after the first lookup', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });
    await allowed('createField', () => qb.createField({ tableId: 'tin1' }, { label: 'A', fieldType: 'text' }));
    s.tables.appin!.push('tin3');
    await allowed('createField in a new table', () =>
      qb.createField({ tableId: 'tin3' }, { label: 'B', fieldType: 'text' })
    );
    expect(s.state.listCalls).toBe(2);
    expect(s.writes).toHaveLength(2);
  });

  it("refuses table writes when the scope's tables can't be listed", async () => {
    const s = scopeServer();
    s.state.listFails = true;
    const qb = scopedClient(s, { appIds: ['appin'] });
    await refused('createField when listing fails', () =>
      qb.createField({ tableId: 'tin1' }, { label: 'A', fieldType: 'text' })
    );
    expect(s.writes).toEqual([]);
  });

  it('lets read-only win', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'], createApps: true }, true);
    await expect(qb.createField({ tableId: 'tin1' }, { label: 'A', fieldType: 'text' })).rejects.toBeInstanceOf(
      ReadOnlyError
    );
    expect(s.writes).toEqual([]);
  });

  it('checks XML write actions by dbid, even through requestXml', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });
    const xml = createXmlClient(qb);

    await refused('API_AddReplaceDBPage outside the scope', () =>
      xml.executeXml('appout', 'API_AddReplaceDBPage', '<pagename>x.js</pagename>')
    );
    // A caller that says write: false for a write action is still checked
    await refused('requestXml with write: false', () =>
      qb.requestXml({ dbid: 'appout', action: 'API_AddReplaceDBPage', body: '', write: false })
    );
    await allowed('API_AddReplaceDBPage in the scope', () =>
      xml.executeXml('appin', 'API_AddReplaceDBPage', '<pagename>x.js</pagename>')
    );
    expect(s.writes).toEqual(['POST /db/appin']);
  });

  it('reports both kinds of refused write as WriteBlockedError', async () => {
    const s = scopeServer();
    const body = { label: 'A', fieldType: 'text' as const };
    await expect(scopedClient(s, { appIds: [] }).createField({ tableId: 'tin1' }, body)).rejects.toBeInstanceOf(
      WriteBlockedError
    );
    const readOnly = createClient({
      realm: 'testrealm',
      auth: { type: 'user-token', userToken: 'token' },
      fetchApi: s.fetchApi,
      readOnly: true,
    });
    await expect(readOnly.createField({ tableId: 'tin1' }, body)).rejects.toBeInstanceOf(WriteBlockedError);
  });
});

describe('Read-only on the XML request path', () => {
  it("can't be turned off by the XML client's options or skipped with requestXml", async () => {
    const s = scopeServer();
    const qb = createClient({
      realm: 'testrealm',
      auth: { type: 'user-token', userToken: 'token' },
      fetchApi: s.fetchApi,
      readOnly: true,
    });
    const xml = createXmlClient(qb, { readOnly: false });

    await expect(xml.executeXml('appin', 'API_AddReplaceDBPage', '<pagename>x.js</pagename>')).rejects.toBeInstanceOf(
      ReadOnlyError
    );
    await expect(
      qb.requestXml({ dbid: 'appin', action: 'API_AddReplaceDBPage', body: '', write: false })
    ).rejects.toBeInstanceOf(ReadOnlyError);
    expect(s.writes).toEqual([]);
  });
});


describe('Write scope beyond apps', () => {
  it('refuses solutions, groups, users and tokens unless named', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });

    await refused('createSolution', () => qb.createSolution('qbl'));
    await refused('createSolutionFromRecord', () => qb.createSolutionFromRecord({ tableId: 'tin1', fieldId: 6, recordId: 1 }));
    await refused('updateSolution', () => qb.updateSolution({ solutionId: 'sol1' }, 'qbl'));
    await refused('updateSolutionToRecord', () =>
      qb.updateSolutionToRecord({ solutionId: 'sol1', tableId: 'tin1', fieldId: 6, recordId: 1 })
    );
    await refused('exportSolutionToRecord into a table outside the scope', () =>
      qb.exportSolutionToRecord({ solutionId: 'sol1', tableId: 'tout1', fieldId: 6 })
    );
    await refused('generateDocument outside the scope', () => qb.generateDocument({ templateId: 1, tableId: 'tout1' }));
    await refused('addMembersToGroup', () => qb.addMembersToGroup({ gid: 42 }, ['u1']));
    await refused('undenyUsers', () => qb.undenyUsers(['u1']));
    await refused('deleteUserToken', () => qb.deleteUserToken());
    expect(s.writes).toEqual([]);
  });

  it('allows what the scope names', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, {
      appIds: ['appin'],
      solutionIds: ['sol1'],
      createSolutions: true,
      groupIds: [42],
      manageUsers: true,
      manageTokens: true,
    });

    await allowed('createSolution', () => qb.createSolution('qbl'));
    await allowed('updateSolution', () => qb.updateSolution({ solutionId: 'sol1' }, 'qbl'));
    await refused('updateSolution of another solution', () => qb.updateSolution({ solutionId: 'sol2' }, 'qbl'));
    await allowed('exportSolutionToRecord into a table in the scope', () =>
      qb.exportSolutionToRecord({ solutionId: 'sol2', tableId: 'tin1', fieldId: 6 })
    );
    await allowed('generateDocument in the scope', () => qb.generateDocument({ templateId: 1, tableId: 'tin1' }));
    await allowed('addMembersToGroup', () => qb.addMembersToGroup({ gid: 42 }, ['u1']));
    await refused('removeSubgroupsFromGroup of another group', () => qb.removeSubgroupsFromGroup({ gid: 7 }, ['42']));
    await allowed('denyUsers', () => qb.denyUsers(['u1']));
    await allowed('denyUsersAndGroups', () => qb.denyUsersAndGroups({ shouldDeleteFromGroups: true }, ['u1']));
    await allowed('cloneUserToken', () => qb.cloneUserToken({}));
    await allowed('deleteUserToken', () => qb.deleteUserToken());
    expect(s.writes).toHaveLength(9);
  });

  it('checks XML group actions by gid and sign-out by manageTokens', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'], groupIds: [42] });
    const xml = createXmlClient(qb);

    await allowed('API_AddUserToGroup 42', () => xml.executeXml('main', 'API_AddUserToGroup', '<gid>42</gid><userid>u1</userid>'));
    await refused('API_AddUserToGroup 7', () => xml.executeXml('main', 'API_AddUserToGroup', '<gid>7</gid>'));
    await refused('API_DeleteGroup without a gid', () => xml.executeXml('main', 'API_DeleteGroup', ''));
    await refused('API_CreateGroup', () => xml.executeXml('main', 'API_CreateGroup', '<name>g</name>'));
    await refused('API_SignOut', () => xml.executeXml('main', 'API_SignOut', ''));

    const all = createXmlClient(scopedClient(s, { createGroups: true, manageTokens: true }));
    await allowed('API_CreateGroup with createGroups', () => all.executeXml('main', 'API_CreateGroup', '<name>g</name>'));
    await allowed('API_SignOut with manageTokens', () => all.executeXml('main', 'API_SignOut', ''));
    expect(s.writes).toEqual(['POST /db/main', 'POST /db/main', 'POST /db/main']);
  });

  it('treats changesetSolution as a read', async () => {
    const s = scopeServer();
    for (const qb of [
      scopedClient(s, {}, true),
      scopedClient(s, {}),
    ]) {
      try {
        await qb.changesetSolution({ solutionId: 'sol1' }, 'qbl');
      } catch (err) {
        expect(err).not.toBeInstanceOf(WriteBlockedError);
      }
    }
    expect(s.writes).toHaveLength(2);
  });
});

// Findings from the adversarial review: each request here got past read-only
// or the write scope before the fix.
describe('Adversarial review findings', () => {
  const guarded = (s: ReturnType<typeof scopeServer>) => ({
    'read-only': scopedClient(s, {}, true),
    'write scope': scopedClient(s, { appIds: ['appin'], solutionIds: ['sol1'] }),
  });

  it('refuses paths a server could read as another path', async () => {
    const s = scopeServer();
    for (const [name, qb] of Object.entries(guarded(s))) {
      for (const path of ['/reports/../records', '/analytics/..\\apps\\appout', '/reports/%2e%2e/records', '/apps//appout']) {
        await expect(
          qb.request({ method: 'POST', path, body: { to: 'tout1', data: [] } }),
          `${name} ${path}`
        ).rejects.toBeInstanceOf(WriteBlockedError);
      }
      await expect(qb.runReport({ reportId: '../apps/appout?', tableId: 'x' }), `${name} runReport`).rejects.toBeInstanceOf(
        WriteBlockedError
      );
      await expect(
        qb.getReport({ reportId: '../solutions/fromrecord?fieldId=6&recordId=1&x=', tableId: 'tin1' }),
        `${name} getReport`
      ).rejects.toBeInstanceOf(WriteBlockedError);
    }
    expect(s.writes).toEqual([]);
  });

  it("judges a lowercase method as what it is", async () => {
    const s = scopeServer();
    for (const [name, qb] of Object.entries(guarded(s))) {
      await expect(
        qb.request({ method: 'get' as 'GET', path: '/solutions/fromrecord', query: { tableId: 'tin1', fieldId: 6, recordId: 1 } }),
        name
      ).rejects.toBeInstanceOf(WriteBlockedError);
    }
    expect(s.writes).toEqual([]);
  });

  it('counts unknown XML actions as writes, in any letter case', async () => {
    const s = scopeServer();
    for (const [name, qb] of Object.entries(guarded(s))) {
      for (const action of ['API_DeleteDatabase', 'api_deletedatabase', 'API_CloneDatabase', 'API_AddField', 'API_UploadFile']) {
        await expect(
          qb.requestXml({ dbid: 'appout', action, body: '', write: false }),
          `${name} ${action}`
        ).rejects.toBeInstanceOf(WriteBlockedError);
      }
      await expect(
        qb.requestXml({ dbid: 'appin?a=API_DeleteDatabase', action: 'API_GetSchema', body: '', write: false }),
        `${name} dbid with a query`
      ).rejects.toBeInstanceOf(WriteBlockedError);
    }
    expect(s.writes).toEqual([]);
  });

  it("can't be fooled about a group by comments, CDATA or a second <gid>", async () => {
    const s = scopeServer();
    const xml = createXmlClient(scopedClient(s, { groupIds: [42] }));
    for (const body of [
      '<!-- <gid>42</gid> --><gid>99</gid>',
      '<gid>42</gid><gid>99</gid>',
      '<gid><![CDATA[42]]></gid>',
      '<gid/><gid>42</gid>',
    ]) {
      await refused(body, () => xml.executeXml('main', 'API_AddUserToGroup', body));
    }
    await allowed('<GID>42</GID>', () => xml.executeXml('main', 'api_addusertogroup', '<GID>42</GID>'));
    expect(s.writes).toEqual(['POST /db/main']);
  });

  it("checks a relationship's parent: required on create, looked up on update and delete", async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });
    await refused('createRelationship without a parent', () =>
      qb.request({ method: 'POST', path: '/tables/tin1/relationship', body: {} })
    );
    await refused('createRelationship with ParentTableId', () =>
      qb.request({ method: 'POST', path: '/tables/tin1/relationship', body: { ParentTableId: 'tout1' } })
    );
    await refused('updateRelationship whose parent is outside', () =>
      qb.request({ method: 'POST', path: '/tables/tin2/relationship/10', body: {} })
    );
    await refused('deleteRelationship whose parent is outside', () =>
      qb.request({ method: 'DELETE', path: '/tables/tin2/relationship/10' })
    );
    await refused("deleteRelationship that can't be found", () =>
      qb.request({ method: 'DELETE', path: '/tables/tin2/relationship/99' })
    );
    expect(s.writes).toEqual([]);
    await allowed('updateRelationship whose parent is in the scope', () =>
      qb.request({ method: 'POST', path: '/tables/tin2/relationship/11', body: {} })
    );
    expect(s.writes).toHaveLength(1);
  });

  it('refuses a body or query that names a checked key in two letter cases', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });
    await refused('upsert to and To', () => qb.request({ method: 'POST', path: '/records', body: { to: 'tin1', To: 'tout1', data: [] } }));
    await refused('createField tableId and TableId', () =>
      qb.request({ method: 'POST', path: '/fields', query: { tableId: 'tin1', TableId: 'tout1' }, body: {} })
    );
    expect(s.writes).toEqual([]);
  });

  it('treats recordsModifiedSince as a read', async () => {
    const s = scopeServer();
    for (const [name, qb] of Object.entries(guarded(s))) {
      try {
        await qb.request({ method: 'POST', path: '/records/modifiedSince', body: { from: 'tout1' } });
      } catch (err) {
        expect(err, name).not.toBeInstanceOf(WriteBlockedError);
      }
    }
    expect(s.writes).toHaveLength(2);
  });
});

describe('Path parameters', () => {
  it('are URL-encoded, so an ID stays one path segment', async () => {
    const s = scopeServer();
    const seen: string[] = [];
    const fetchApi = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(`${init?.method ?? 'GET'} ${new URL(typeof input === 'string' ? input : input.toString()).pathname}`);
      return s.fetchApi(input, init);
    }) as typeof fetch;
    // No read-only or write scope: the encoding alone keeps the ID in place
    const qb = createClient({ realm: 'testrealm', auth: { type: 'user-token', userToken: 'token' }, fetchApi });
    try {
      await qb.getApp({ appId: '../solutions/x?y=1#z' });
    } catch {
      // the fake server's answer doesn't matter
    }
    expect(seen).toEqual(['GET /v1/apps/..%2Fsolutions%2Fx%3Fy%3D1%23z']);
  });
});

// Second adversarial review.
describe('Second review findings', () => {
  const guarded = (s: ReturnType<typeof scopeServer>) => ({
    'read-only': scopedClient(s, {}, true),
    'write scope': scopedClient(s, { appIds: ['appin'], solutionIds: ['sol1'] }),
  });

  it('checks and sends the same body, whatever toJSON says', async () => {
    const s = scopeServer();
    const sent: string[] = [];
    const fetchApi = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.body) sent.push(String(init.body));
      return s.fetchApi(input, init);
    }) as typeof fetch;
    const qb = createClient({
      realm: 'testrealm',
      auth: { type: 'user-token', userToken: 'token' },
      fetchApi,
      writeScope: { appIds: ['appin'] },
    });
    const body = { to: 'tin1', data: [], toJSON: () => ({ to: 'tout1', data: [] }) };
    await expect(qb.request({ method: 'POST', path: '/records', body })).rejects.toBeInstanceOf(WriteScopeError);
    expect(sent.filter((b) => b.includes('tout1'))).toEqual([]);
  });

  it('adds the leading slash before judging a path', async () => {
    const s = scopeServer();
    for (const [name, qb] of Object.entries(guarded(s))) {
      for (const path of ['solutions/fromrecord', 'docTemplates/1/generate', 'solutions/s1/torecord']) {
        await expect(
          qb.request({ method: 'GET', path, query: { tableId: 'tout1', fieldId: 6, recordId: 1 } }),
          `${name} ${path}`
        ).rejects.toBeInstanceOf(WriteBlockedError);
      }
    }
    expect(s.writes).toEqual([]);
  });

  it("can't have its settings changed through getConfig", async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] }, true);
    const config = qb.getConfig();
    expect(() => {
      (config as { readOnly: boolean }).readOnly = false;
    }).toThrow();
    config.writeScope?.apps.add('appout');
    await expect(qb.deleteApp({ appId: 'appout' }, { name: 'x' })).rejects.toBeInstanceOf(WriteBlockedError);
    const scoped = scopedClient(s, { appIds: ['appin'] });
    scoped.getConfig().writeScope?.apps.add('appout');
    await refused('deleteApp after adding to a copy of the scope', () => scoped.deleteApp({ appId: 'appout' }, { name: 'x' }));
    expect(s.writes).toEqual([]);
  });

  it('needs createApps for XML clone and create, and manageUsers for provisioning', async () => {
    const s = scopeServer();
    const xml = createXmlClient(scopedClient(s, { appIds: ['appin'] }));
    await refused('API_CloneDatabase', () => xml.executeXml('appin', 'API_CloneDatabase', '<newdbname>x</newdbname>'));
    await refused('API_CreateDatabase', () => xml.executeXml('appin', 'API_CreateDatabase', ''));
    await refused('API_ProvisionUser', () => xml.executeXml('appin', 'API_ProvisionUser', '<email>a@b.c</email>'));
    expect(s.writes).toEqual([]);

    const all = createXmlClient(scopedClient(s, { appIds: ['appin'], createApps: true, manageUsers: true }));
    await allowed('API_CloneDatabase with createApps', () => all.executeXml('appin', 'API_CloneDatabase', ''));
    await allowed('API_ProvisionUser with manageUsers', () => all.executeXml('appin', 'API_ProvisionUser', ''));
    await refused('API_ProvisionUser outside the scope', () => all.executeXml('appout', 'API_ProvisionUser', ''));
    expect(s.writes).toHaveLength(2);
  });

  it('matches group IDs as written, including the XML form', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { groupIds: ['1217.dgpt', 42] });
    const xml = createXmlClient(qb);
    await allowed('<gid>1217.dgpt</gid>', () => xml.executeXml('main', 'API_AddUserToGroup', '<gid>1217.dgpt</gid>'));
    await refused('<gid>1217</gid>', () => xml.executeXml('main', 'API_AddUserToGroup', '<gid>1217</gid>'));
    await refused('a namespaced gid', () => xml.executeXml('main', 'API_AddUserToGroup', '<x:gid>99</x:gid><gid>42</gid>'));
    await refused('a DOCTYPE entity', () =>
      xml.executeXml('main', 'API_AddUserToGroup', '<!DOCTYPE q [<!ENTITY e "&#60;gid>99&#60;/gid>">]><gid>42</gid>&e;')
    );
    await allowed('JSON group 42', () => qb.addMembersToGroup({ gid: 42 }, ['u1']));
    expect(s.writes).toHaveLength(2);
  });

  it('refuses method overrides, trailing slashes and other letter cases', async () => {
    const s = scopeServer();
    for (const [name, qb] of Object.entries(guarded(s))) {
      await expect(
        qb.request({ method: 'GET', path: '/apps/appout', headers: { 'x-http-method-override': 'DELETE' } }),
        `${name} override`
      ).rejects.toBeInstanceOf(WriteBlockedError);
      await expect(
        qb.request({ method: 'GET', path: '/solutions/fromrecord/', query: { tableId: 'tin1', fieldId: 6, recordId: 1 } }),
        `${name} trailing slash`
      ).rejects.toBeInstanceOf(WriteBlockedError);
      await expect(
        qb.request({ method: 'GET', path: '/Solutions/s1/ToRecord', query: { tableId: 'tout1', fieldId: 6 } }),
        `${name} letter case`
      ).rejects.toBeInstanceOf(WriteBlockedError);
    }
    expect(s.writes).toEqual([]);
  });

  it('checks trustees and a table update’s appId', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });
    await refused('trustees outside the scope', () => qb.request({ method: 'POST', path: '/app/appout/trustees', body: [] }));
    await refused('updateTable with an appId outside the scope', () => qb.updateTable({ tableId: 'tin1', appId: 'appout' }, {}));
    expect(s.writes).toEqual([]);
    await allowed('trustees in the scope', () => qb.request({ method: 'POST', path: '/app/appin/trustees', body: [] }));
    expect(s.writes).toHaveLength(1);
  });
});

// Third adversarial review.
describe('Third review findings', () => {
  const schema = {
    tables: {
      inside: { id: 'tin1', fields: { name: 6 } },
      outside: { id: 'tout1', fields: { name: 6 } },
    },
  };
  const withSchema = (s: ReturnType<typeof scopeServer>) =>
    createClient({
      realm: 'testrealm',
      auth: { type: 'user-token', userToken: 'token' },
      fetchApi: s.fetchApi,
      rateLimit: { retry: { maxAttempts: 1 } },
      schema,
      writeScope: { appIds: ['appin'] },
    });

  it('works with a schema: list responses stay lists, and in-scope writes go through', async () => {
    const s = scopeServer();
    const qb = withSchema(s);
    const tables = await qb.getAppTables({ appId: 'appin' });
    expect(Array.isArray(tables)).toBe(true);
    await allowed('upsert by alias', () => qb.upsert({ to: 'inside', data: [] }));
    await allowed('createField in the scope', () => qb.createField({ tableId: 'tin1' }, { label: 'X', fieldType: 'text' }));
    await refused('upsert to an alias outside the scope', () => qb.upsert({ to: 'outside', data: [] }));
    expect(s.writes).toHaveLength(2);
  });

  it('checks a path as it is sent, without resolving aliases the send keeps', async () => {
    const s = scopeServer();
    const qb = withSchema(s);
    // A table alias in a path goes out unresolved, so it isn't an ID in the scope
    await refused('deleteFile with an alias in the path', () =>
      qb.deleteFile({ tableId: 'inside', recordId: 1, fieldId: 6, versionNumber: 1 })
    );
    // Changing the schema getConfig returns can't change the client's
    qb.getConfig().schema?.tableAliasToId?.set?.('tout1', 'tin1');
    await refused('deleteFile outside the scope after editing a copy of the schema', () =>
      qb.deleteFile({ tableId: 'tout1', recordId: 1, fieldId: 6, versionNumber: 1 })
    );
    expect(s.writes).toEqual([]);
  });

  it('reads each query value once, and refuses values that are not plain', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });
    let reads = 0;
    const query = {
      get tableId() {
        reads++;
        return reads <= 3 ? 'tin1' : 'tout1';
      },
    };
    await allowed('a getter query', () => qb.request({ method: 'POST', path: '/fields', query, body: {} }));
    expect(s.writes).toEqual(['POST /fields']);
    expect(s.urls.at(-1)).toContain('tableId=tin1');
    await refused('an object query value', () =>
      qb.request({ method: 'POST', path: '/fields', query: { tableId: { toString: () => 'tin1' } as unknown as string }, body: {} })
    );
  });

  it('needs a bodyType body to be a string', async () => {
    const s = scopeServer();
    const qb = scopedClient(s, { appIds: ['appin'] });
    await refused('an object body with bodyType', () =>
      qb.request({
        method: 'POST',
        path: '/records',
        bodyType: 'application/json',
        body: { to: 'tin1', toString: () => '{"to":"tout1","data":[]}' },
      })
    );
    expect(s.writes).toEqual([]);
  });

  it('refuses unusual methods, empty segments and realm headers', async () => {
    const s = scopeServer();
    for (const [name, qb] of Object.entries({
      'read-only': scopedClient(s, {}, true),
      'write scope': scopedClient(s, { appIds: ['appin'] }),
    })) {
      await expect(qb.request({ method: 'PROPPATCH' as 'GET', path: '/apps/appout' }), `${name} PROPPATCH`).rejects.toBeInstanceOf(
        WriteBlockedError
      );
      await expect(qb.request({ method: 'GET', path: '/apps//appin' }), `${name} //`).rejects.toBeInstanceOf(WriteBlockedError);
      await expect(
        qb.request({ method: 'GET', path: '/apps/appin', headers: { 'QB-Realm-Hostname': 'other.quickbase.com' } }),
        `${name} realm header`
      ).rejects.toBeInstanceOf(WriteBlockedError);
    }
    expect(s.writes).toEqual([]);
  });
});
