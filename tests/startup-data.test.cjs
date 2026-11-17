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
  vm.runInContext(fs.readFileSync('src/startupData.js', 'utf8').replace(/export /g, '') + '\nthis.api = { synchronizeData, readReferenceData, referenceFormulaValue, referenceChoices, referenceChoiceDetails };', context);
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


test('choice fields use sorted reference names, include subraces, and discard removed data', async () => {
  const env = setup();
  env.setFiles({ 'choices.json': JSON.stringify({
    classes: [{ name: 'Wizard' }, { name: 'Bard' }],
    races: [{ name: 'Elf', subraces: [{ name: 'High Elf' }] }],
  }), 'extra.json': JSON.stringify({ classes: [{ name: 'Bard' }] }) });
  await env.synchronizeData(() => {});
  assert.deepEqual(Array.from(env.referenceChoices('classes')), ['Bard', 'Wizard']);
  assert.deepEqual(Array.from(env.referenceChoices('races')), ['Elf', 'High Elf']);
  env.setFiles({});
  await env.synchronizeData(() => {});
  assert.equal(env.referenceChoices('classes').length, 0);
});


test('choice details preserve class features, source, enum labels and inherited race traits', async () => {
  const env = setup();
  const source = { name: "Player's Handbook" };
  env.setFiles({
    'enums.json': JSON.stringify({ enums: { ability: { 2: 'Constitution' } } }),
    'book.json': JSON.stringify({ source,
      classes: [{ name: 'Wizard', hitDice: '1d6', features: [{ name: 'Spellcasting', description: '<p>Cast spells.</p>' }] }],
      races: [{ name: 'Elf', baseWalkingSpeed: 30, traits: [{ name: 'Darkvision' }], subraces: [{ name: 'High Elf', traits: [{ name: 'Cantrip' }] }] }],
    }),
  });
  await env.synchronizeData(() => {});
  const wizard = env.referenceChoiceDetails('classes', 'Wizard');
  assert.equal(wizard.entry.features[0].description, '<p>Cast spells.</p>');
  assert.equal(wizard.source.name, source.name);
  assert.equal(wizard.enums.ability[2], 'Constitution');
  const elf = env.referenceChoiceDetails('races', 'High Elf');
  assert.equal(elf.parent.baseWalkingSpeed, 30);
  assert.equal(elf.parent.traits[0].name, 'Darkvision');
  assert.equal(elf.entry.traits[0].name, 'Cantrip');
  assert.equal(env.referenceChoiceDetails('classes', 'Missing'), null);
  env.setFiles({});
  await env.synchronizeData(() => {});
  assert.equal(env.referenceChoiceDetails('classes', 'Wizard'), null);
});


test('subclass details include only that subclass features and notes', async () => {
  const env = setup();
  env.setFiles({ 'classes.json': JSON.stringify({ classes: [{ name: 'Wizard',
    subclasses: ['School of Evocation', 'School of Illusion'],
    features: [{ name: 'Spellcasting', subclass: null },
      { name: 'Sculpt Spells', subclass: 'School of Evocation' },
      { name: 'Improved Minor Illusion', subclass: 'School of Illusion' }],
    notes: [{ name: 'Evocation note', subclass: 'School of Evocation' }],
  }] }) });
  await env.synchronizeData(() => {});
  const details = env.referenceChoiceDetails('classes', 'Wizard', 'School of Evocation');
  assert.equal(details.entry.name, 'School of Evocation');
  assert.equal(details.entry.class, 'Wizard');
  assert.deepEqual(Array.from(details.entry.features, feature => feature.name), ['Sculpt Spells']);
  assert.equal(details.entry.notes[0].name, 'Evocation note');
  assert.equal(env.referenceChoiceDetails('classes', 'Wizard', 'Missing'), null);
});
