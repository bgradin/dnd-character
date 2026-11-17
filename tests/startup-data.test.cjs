const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { createHash, webcrypto } = require('node:crypto');

function setup({ storageUnavailable = false, quotaExceeded = false, corrupt = false } = {}) {
  const stored = new Map();
  const calls = [];
  let files = { 'nested/a.json': '{"name":"first"}' };
  let fail = false;
  const cache = {
    match: async url => stored.get(url)?.clone(),
    put: async (url, response) => {
      if (quotaExceeded) throw new Error("Quota exceeded");
      stored.set(url, response.clone());
    },
    keys: async () => [...stored.keys()].map(url => ({ url })),
    delete: async key => stored.delete(key.url),
  };
  const context = vm.createContext({
    URL, Response, Headers, Uint8Array, crypto: webcrypto,
    document: { baseURI: 'https://example.com/' },
    caches: { open: async () => {
      if (storageUnavailable) throw new Error("Storage unavailable");
      return cache;
    } },
    fetch: async (url, options) => {
      url = String(url);
      calls.push([url, options.cache]);
      if (url.endsWith('manifest.json')) return Response.json({ schemaVersion: 1, files: Object.fromEntries(
        Object.entries(files).map(([path, text]) => [path, { size: Buffer.byteLength(text), sha256: createHash('sha256').update(text).digest('hex') }])) });
      return fail ? new Response('', { status: 503 }) : new Response(corrupt ? '{"name":"wrong"}' : files[decodeURIComponent(url.split('/data/')[1])]);
    },
  });
  vm.runInContext(fs.readFileSync('src/startupData.js', 'utf8').replace(/export /g, '') + '\nthis.api = { synchronizeData, readReferenceData, referenceFormulaValue };', context);
  return { ...context.api, stored, calls, setFiles: value => { files = value; }, fail: () => { fail = true; } };
}

test('startup data reuses matching hashes, replaces changed files, and prunes removed files', async () => {
  const env = setup();
  const progress = [];
  await env.synchronizeData(n => progress.push(n));
  assert.equal(progress.at(-1), 1);
  assert.equal((await env.readReferenceData('nested/a.json')).name, 'first');
  assert.deepEqual(env.calls.map(call => call[1]), ['no-store', 'reload']);
  env.calls.length = 0;
  await env.synchronizeData(() => {});
  assert.equal(env.calls.length, 1);
  env.setFiles({ 'nested/a.json': '{"name":"changed"}', 'space name.json': '{}' });
  await env.synchronizeData(() => {});
  assert.equal((await env.readReferenceData('nested/a.json')).name, 'changed');
  assert.ok(env.calls.some(([url]) => url.endsWith('space%20name.json')));
  env.setFiles({});
  await env.synchronizeData(() => {});
  assert.equal(env.stored.size, 0);
  await assert.rejects(env.readReferenceData('nested/a.json'), /not loaded/);
});

test('failed downloads never replace cached data or its hash', async () => {
  const env = setup();
  await env.synchronizeData(() => {});
  env.setFiles({ 'nested/a.json': '{"name":"changed"}' });
  env.fail();
  await assert.rejects(env.synchronizeData(() => {}), /Unable to download/);
  assert.equal((await env.readReferenceData('nested/a.json')).name, 'first');
});


test('unavailable storage and exhausted quota fall back to memory across synchronization', async () => {
  for (const options of [{ storageUnavailable: true }, { quotaExceeded: true }]) {
    const env = setup(options);
    await env.synchronizeData(() => {});
    assert.equal((await env.readReferenceData('nested/a.json')).name, 'first');
    env.setFiles({ 'nested/a.json': '{"name":"changed"}' });
    await env.synchronizeData(() => {});
    assert.equal((await env.readReferenceData('nested/a.json')).name, 'changed');
    const calls = env.calls.length;
    await env.synchronizeData(() => {});
    assert.equal(env.calls.length, calls + 1);
  }
});

test('corrupt downloads are rejected before entering the cache', async () => {
  const env = setup({ corrupt: true });
  await assert.rejects(env.synchronizeData(() => {}), /verification failed/);
  assert.equal(env.stored.size, 0);
});


test('formula reference values include every loaded file and remove stale sources', async () => {
  const env = setup();
  env.setFiles({ 'races.json': JSON.stringify({ races: [{ name: 'Custom', baseWalkingSpeed: 45 }] }),
    'classes.json': JSON.stringify({ classes: [{ name: 'Custom', hitPointsAtFirstLevel: { base: 10 }, hitPointsAtHigherLevels: { average: 6 } }] }) });
  await env.synchronizeData(() => {});
  const selected = () => ' custom ';
  assert.equal(env.referenceFormulaValue('race.baseWalkingSpeed', selected), 45);
  assert.equal(env.referenceFormulaValue('class.hitPointsAtFirstLevel', selected), 10);
  assert.equal(env.referenceFormulaValue('class.hitPointsAtHigherLevels', selected), 6);
  await env.synchronizeData(() => {});
  assert.equal(env.referenceFormulaValue('race.baseWalkingSpeed', selected), 45);
  env.setFiles({});
  await env.synchronizeData(() => {});
  assert.equal(env.referenceFormulaValue('race.baseWalkingSpeed', selected), 0);
});
