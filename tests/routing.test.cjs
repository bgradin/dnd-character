const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

async function startup({ user = null, sessionError, dataError, hash = '#/sheets/hero' } = {}) {
  const replacements = [];
  const mounted = [];
  const bar = { value: 0 };
  const error = { hidden: true };
  const context = vm.createContext({
    URL, URLSearchParams,
    document: { baseURI: 'https://example.com/', getElementById: id => id === 'startup-progress' ? bar : error },
    window: { location: { pathname: '/characters', search: '?action=login&test=1', hash },
      history: { replaceState: (...args) => replacements.push(args[2]) } },
    request: async () => { if (sessionError) throw sessionError; return { user }; },
    synchronizeData: async progress => { if (dataError) throw dataError; progress(1); },
    fetch: async () => ({ ok: true, json: async () => [] }),
    loadApp: async () => ({ prepare: async user => user ? ['sheet'] : [], mount: (...args) => mounted.push(args) }),
  });
  const source = fs.readFileSync('src/index.js', 'utf8')
    .replace(/^import .*;\n/gm, '')
    .replace('import(/* webpackChunkName: "app" */ \'./mountApp\')', 'loadApp()');
  vm.runInContext(source, context);
  await new Promise(setImmediate);
  return { replacements, mounted, bar, error };
}

test('authenticated startup opens character selection and removes callback actions and sheet routes', async () => {
  const user = { id: 7 };
  const env = await startup({ user });
  assert.deepEqual(env.replacements, ['/characters?test=1']);
  assert.deepEqual(env.mounted, [[user, ['sheet']]]);
  assert.equal(env.bar.value, 1);
  assert.equal(env.error.hidden, true);
});

test('anonymous and expired sessions open login/register', async () => {
  for (const options of [{}, { sessionError: Object.assign(new Error('Expired'), { status: 401 }) }]) {
    const env = await startup(options);
    assert.deepEqual(env.mounted, [[null, []]]);
    assert.equal(env.error.hidden, true);
  }
});

test('session and data failures retain loader and show an error without mounting the app', async () => {
  for (const options of [{ sessionError: new Error('Offline') }, { dataError: new Error('Download failed') }]) {
    const env = await startup(options);
    assert.equal(env.mounted.length, 0);
    assert.equal(env.replacements.length, 0);
    assert.equal(env.error.hidden, false);
    assert.ok(env.error.textContent);
  }
});

test('startup waits for both authentication and data before mounting', async () => {
  let finishSession, finishData;
  const mounted = [];
  const context = vm.createContext({
    URL, URLSearchParams,
    document: { baseURI: 'https://example.com/', getElementById: () => ({}) },
    window: { location: { pathname: '/', search: '' }, history: { replaceState() {} } },
    request: () => new Promise(resolve => { finishSession = resolve; }),
    synchronizeData: () => new Promise(resolve => { finishData = resolve; }),
    fetch: async () => ({ ok: true, json: async () => [] }),
    loadApp: async () => ({ prepare: async () => [], mount: () => mounted.push(true) }),
  });
  vm.runInContext(fs.readFileSync('src/index.js', 'utf8').replace(/^import .*;\n/gm, '')
    .replace('import(/* webpackChunkName: "app" */ \'./mountApp\')', 'loadApp()'), context);
  finishSession({ user: null });
  await new Promise(setImmediate);
  assert.equal(mounted.length, 0);
  finishData();
  await new Promise(setImmediate);
  assert.equal(mounted.length, 1);
});
