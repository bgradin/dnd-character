const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const babel = require('@babel/core');

function app(sessionRequest) {
  const effects = [];
  const replacements = [];
  const listeners = {};
  const location = { pathname: '/characters', search: '?test=1', hash: '#/sheets/hero' };
  const context = vm.createContext({
    URLSearchParams,
    React: { createElement() {} },
    CloudCheck: 'icon', CloudOff: 'icon', RefreshCw: 'icon', accountUrl: path => path,
    useState: value => [value, () => {}],
    useEffect: effect => effects.push(effect),
    request: sessionRequest,
    window: { location, history: { replaceState(_, __, url) {
      replacements.push(url);
      const next = new URL(url, 'https://example.com');
      Object.assign(location, { pathname: next.pathname, search: next.search, hash: next.hash });
    } },
      addEventListener: (name, handler) => listeners[name] = handler, removeEventListener() {} },
  });
  const source = fs.readFileSync('src/App.js', 'utf8').replace(/^import [\s\S]*?;\n/gm, '').replace('export default function App', 'function App');
  vm.runInContext(babel.transformSync(source, { presets: ['@babel/preset-react'] }).code + '\nApp(); this.route = requestedSheet;', context);
  return { context, effects, replacements, location, listeners };
}

test('signed-out session removes a character sheet hash while preserving path and query', async () => {
  const env = app(async () => { const error = new Error('Unauthorized'); error.status = 401; throw error; });
  env.effects[0]();
  await new Promise(setImmediate);
  assert.deepEqual(env.replacements, ['/characters?test=1']);
});

test('session handling removes all action parameters and preserves other parameters and the sheet route', async () => {
  let complete;
  const env = app(() => new Promise(resolve => { complete = resolve; }));
  env.location.search = '?action=login&test=1&action=other';
  env.effects[0]();
  assert.equal(env.replacements.length, 0);
  complete({ user: { id: 7 } });
  await new Promise(setImmediate);
  assert.deepEqual(env.replacements, ['/characters?test=1#/sheets/hero']);
});

test('signed-out session removes an empty action parameter without leaving a query delimiter', async () => {
  const env = app(async () => ({ user: null }));
  env.location.search = '?action=';
  env.effects[0]();
  await new Promise(setImmediate);
  assert.equal(env.replacements.at(-1), '/characters');
});

test('temporary session failures retain the action parameter for retry', async () => {
  const env = app(async () => { throw new Error('Offline'); });
  env.location.search = '?action=login';
  env.effects[0]();
  await new Promise(setImmediate);
  assert.equal(env.replacements.length, 0);
  assert.equal(env.location.search, '?action=login');
});

test('authenticated deep links retain the requested character sheet hash', async () => {
  const env = app(async () => ({ user: { id: 7 } }));
  env.effects[0]();
  await new Promise(setImmediate);
  assert.equal(env.replacements.length, 0);
  assert.equal(env.context.route(), 'hero');
  env.location.hash = '#/sheets/hero%2Fname';
  assert.equal(env.context.route(), 'hero/name');
  env.location.hash = '';
  assert.equal(env.context.route(), null);
});
