const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function app(cached, handler) {
  const entries = new Map(cached ? [['dnd-character:v1:7', JSON.stringify(cached)]] : []);
  const events = {};
  class Input {
    constructor(name) { this.name = name; }
    addEventListener(_, callback) { this.edit = callback; }
  }
  const context = vm.createContext({
    fetch: async (...args) => ({ ok: true, status: 200, json: async () => handler(...args) }),
    AbortController, setTimeout: () => 1, clearTimeout() {}, URL,
    localStorage: { getItem: key => entries.get(key) || null, setItem: (key, value) => entries.set(key, value) },
    window: { addEventListener: (name, cb) => events[name] = cb, confirm: () => false },
    document: { addEventListener() {} }, navigator: { onLine: true },
    HTMLInputElement: Input, HTMLTextAreaElement: class {},
  });
  vm.runInContext(fs.readFileSync('src/data.js', 'utf8').replace(/export /g, '') + '\nthis.api = { initialize, register, save, prepareToLeave };', context);
  return { api: context.api, entries, events, Input };
}
const user = { id: 7, firstName: 'Ada', lastName: 'Lovelace' };

test('defaults player name, persists edits before PUT and records acknowledged save', async () => {
  let puts = 0;
  const env = app(null, (path, options) => {
    if (options.method === 'PUT') {
      puts++;
      assert.equal(JSON.parse(env.entries.get('dnd-character:v1:7')).data.playerName, 'Custom');
      assert.equal(JSON.parse(options.body).data.playerName, 'Custom');
      return { revision: 2 };
    }
    return { schemaVersion: 1, revision: 1, data: {} };
  });
  await env.api.initialize(() => {}, user);
  const input = new env.Input('playerName');
  env.api.register(input);
  assert.equal(input.value, 'Ada Lovelace');
  input.value = 'Custom'; input.edit();
  const pending = JSON.parse(env.entries.get('dnd-character:v1:7'));
  assert.ok(pending.lastEditedAt > pending.lastSavedAt);
  await env.api.save();
  const saved = JSON.parse(env.entries.get('dnd-character:v1:7'));
  assert.ok(saved.lastSavedAt >= saved.lastEditedAt);
  assert.equal(puts, 1);
});

test('recovers and uploads newer unsaved local data', async () => {
  let payload;
  const env = app({ schemaVersion: 1, revision: 1, data: { playerName: 'Local' }, lastEditedAt: 200, lastSavedAt: 100 }, (_, options) => {
    if (options.method === 'PUT') { payload = JSON.parse(options.body); return { revision: 3 }; }
    return { schemaVersion: 1, revision: 2, data: { playerName: 'Server' } };
  });
  await env.api.initialize(() => {}, user);
  await env.api.save();
  assert.equal(payload.data.playerName, 'Local');
  assert.equal(payload.revision, 2);
});

test('offline recovery remains editable and protects navigation', async () => {
  const env = app({ schemaVersion: 1, revision: 1, data: { playerName: 'Local' }, lastEditedAt: 200, lastSavedAt: 100 }, () => { throw new Error('offline'); });
  await env.api.initialize(() => {}, user);
  assert.equal(await env.api.prepareToLeave(), false);
  let prevented = false;
  env.events.beforeunload({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});

test('edits during upload stay pending and are uploaded in order', async () => {
  let release;
  let puts = 0;
  const env = app(null, (_, options) => {
    if (options.method !== 'PUT') return { schemaVersion: 1, revision: 1, data: { playerName: 'Original' } };
    puts++;
    if (puts === 1) return new Promise(resolve => { release = () => resolve({ revision: 2 }); });
    assert.equal(JSON.parse(options.body).revision, 2);
    assert.equal(JSON.parse(options.body).data.playerName, 'Second');
    return { revision: 3 };
  });
  await env.api.initialize(() => {}, user);
  const input = new env.Input('playerName'); env.api.register(input);
  input.value = 'First'; input.edit();
  const saving = env.api.save();
  await new Promise(setImmediate);
  input.value = 'Second'; input.edit();
  release();
  await saving;
  assert.equal(puts, 2);
  assert.equal(JSON.parse(env.entries.get('dnd-character:v1:7')).revision, 3);
});

test('clean local copy does not replace server data', async () => {
  const env = app({ schemaVersion: 1, revision: 1, data: { playerName: 'Old' }, lastEditedAt: 100, lastSavedAt: 200 }, () => ({ schemaVersion: 1, revision: 2, data: { playerName: 'Latest' } }));
  await env.api.initialize(() => {}, user);
  const input = new env.Input('playerName'); env.api.register(input);
  assert.equal(input.value, 'Latest');
});
