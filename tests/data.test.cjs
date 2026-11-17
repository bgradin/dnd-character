const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function app(cached, handler, rawResponses = false, mode = 'development') {
  const entries = new Map(cached ? [['dnd-character:v1:7', JSON.stringify(cached)]] : []);
  const events = {};
  class Input {
    constructor(name) { this.name = name; }
    addEventListener(_, callback) { this.edit = callback; }
  }
  const context = vm.createContext({
    process: { env: { NODE_ENV: mode } },
    fetch: async (...args) => ({ ok: true, status: 200, json: async () => {
      const result = await handler(...args);
      if (rawResponses) return result;
      if (!args[1].method && args[0] === '/api/dnd/v1') return result.sheets ? result : { sheets: [{ sheetId: 'sheet-1', ...result }] };
      return { sheetId: 'sheet-1', ...result };
    } }),
    AbortController, setTimeout: () => 1, clearTimeout() {}, URL,
    localStorage: { getItem: key => entries.get(key) || null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) },
    window: { addEventListener: (name, cb) => events[name] = cb, confirm: () => false },
    document: { addEventListener() {} }, navigator: { onLine: true },
    HTMLInputElement: Input, HTMLTextAreaElement: class {},
  });
  vm.runInContext((fs.readFileSync('src/formulas.js', 'utf8') + '\n' + fs.readFileSync('src/request.js', 'utf8') + '\n' + fs.readFileSync('src/data.js', 'utf8').replace(/^(?:import .*|export \{ request \} from .*);\n/gm, '')).replace(/export /g, '') + '\nthis.api = { request, initialize, register, save, prepareToLeave, setFormula, previewFormula, listSheets, createSheet, deleteSheet, preloadSheets };', context);
  return { api: context.api, entries, events, Input };
}
const user = { id: 7, firstName: 'Ada', lastName: 'Lovelace' };

test('production API calls use the www domain and include session cookies', async () => {
  const calls = [];
  const env = app(null, (url, options) => { calls.push([url, options]); return {}; }, true, 'production');
  for (const path of ['/api/v1/site/session', '/api/v1/site/logout', '/api/dnd/v1', '/api/dnd/v1/hero%2Fid']) {
    await env.api.request(path);
    const [url, options] = calls.at(-1);
    assert.equal(url, `https://www.gradinware.com${path}`);
    assert.equal(options.credentials, 'include');
  }
});

test('single-character servers list, recover old local edits, and save to the original endpoint', async () => {
  const cached = { schemaVersion: 1, revision: 11, data: { 'character-name': 'Albin Oathsworn', 'strength-score': '18', playerName: 'Brian Gradin' }, lastEditedAt: 200, lastSavedAt: 100 };
  const writes = [];
  const env = app(cached, (path, options) => {
    assert.equal(path, '/api/dnd/v1');
    if (options.method) {
      assert.equal(options.method, 'PUT');
      writes.push(JSON.parse(options.body));
      return { revision: 11 + writes.length };
    }
    return { schemaVersion: 1, revision: 11, data: { ...cached.data, 'strength-score': '14' } };
  }, true);
  const sheets = await env.api.listSheets();
  assert.equal(sheets[0].data['character-name'], 'Albin Oathsworn');
  assert.equal(sheets[0].legacy, true);
  await env.api.initialize(() => {}, user, sheets[0].sheetId);
  const input = new env.Input('strength-score'); env.api.register(input);
  assert.equal(input.value, '18');
  await env.api.save();
  input.value = '20'; input.edit();
  await env.api.save();
  assert.equal(writes[0].revision, 11);
  assert.equal(writes[0].data['strength-score'], '18');
  assert.equal(writes[1].revision, 12);
  assert.equal(writes[1].data['strength-score'], '20');
  assert.deepEqual(JSON.parse(env.entries.get('dnd-character:v1:7')), cached);
  await assert.rejects(env.api.createSheet(user), /updated server/);
  await assert.rejects(env.api.deleteSheet(sheets[0].sheetId, user), /updated server/);
});

test('invalid sheet collections fail before rendering and preserve recovery data', async () => {
  const cached = { schemaVersion: 1, revision: 11, data: { 'character-name': 'Albin Oathsworn' }, lastEditedAt: 200, lastSavedAt: 100 };
  for (const sheets of [{}, [null], [{ sheetId: 'hero' }], [{ sheetId: 'hero', data: null }]]) {
    const env = app(cached, () => ({ sheets }));
    await assert.rejects(env.api.listSheets(), /server returned an unexpected response/);
    assert.deepEqual(JSON.parse(env.entries.get('dnd-character:v1:7')), cached);
  }
});

test('defaults player name, persists edits before PUT and records acknowledged save', async () => {
  let puts = 0;
  const env = app(null, (path, options) => {
    if (options.method === 'PUT') {
      puts++;
      assert.equal(path, '/api/dnd/v1/sheet-1');
      assert.equal(options.headers['X-Site-Action'], '1');
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


test('formulas recalculate chains on input, persist, reject cycles, and can be removed', async () => {
  let payload;
  const env = app(null, (_, options) => {
    if (options.method === 'PUT') { payload = JSON.parse(options.body); return { revision: 2 }; }
    return { schemaVersion: 1, revision: 1, data: { playerName: 'Ada', strength: '12' } };
  });
  await env.api.initialize(() => {}, user);
  const source = new env.Input('strength'), target = new env.Input('bonus'), downstream = new env.Input('attack');
  [source, target, downstream].forEach(input => env.api.register(input));
  env.api.setFormula('bonus', [{ field: 'strength' }, '/', '2', '-', '5']);
  env.api.setFormula('attack', [{ field: 'bonus' }, '+', '3']);
  assert.equal(target.value, '1');
  assert.equal(downstream.value, '4');
  assert.equal(target.readOnly, true);
  source.value = '18'; source.edit();
  assert.equal(target.value, '4');
  assert.equal(downstream.value, '7');
  assert.throws(() => env.api.setFormula('strength', [{ field: 'attack' }]), /circular/);
  assert.throws(() => env.api.previewFormula('bonus', ['1', '/', '0']), /zero/);
  await env.api.save();
  assert.equal(payload.data.attack, '7');
  assert.ok(payload.data.formulas.bonus);
  env.api.setFormula('bonus', null);
  assert.equal(target.readOnly, false);
  target.value = '9'; target.edit();
  assert.equal(downstream.value, '12');
});

test('formula grammar supports grouping and rejects unsupported operations', async () => {
  const env = app(null, () => ({ schemaVersion: 1, revision: 1, data: { playerName: 'Ada' } }));
  await env.api.initialize(() => {}, user);
  assert.equal(env.api.previewFormula('test', ['(', '2', '+', '3', ')', '*', '-', '4']), -20);
  assert.throws(() => env.api.previewFormula('test', ['2', '^', '3']), /operator/);
  assert.throws(() => env.api.previewFormula('test', ['(', '2']), /parenthesis/);
});

test('min and max support expressions, references and nested calls with argument validation', async () => {
  const env = app(null, () => ({ schemaVersion: 1, revision: 1, data: { source: '7' } }));
  await env.api.initialize(() => {}, user);
  assert.equal(env.api.previewFormula('test', ['min', '(', { field: 'source' }, ',', '2', '+', '3', ',', '-', '1', ')']), -1);
  assert.equal(env.api.previewFormula('test', ['max', '(', 'min', '(', '8', ',', '3', ')', ',', '2', ')', '*', '4']), 12);
  for (const tokens of [
    ['min', '(', ')'], ['max', '(', '1', ')'],
    ['min', '(', '1', ',', ')'], ['max', '1'],
    ['max', '(', '1', ',', '2'],
  ]) assert.throws(() => env.api.previewFormula('test', tokens));
});

test('ceil and floor round expressions and references and require one argument', async () => {
  const env = app(null, () => ({ schemaVersion: 1, revision: 1, data: { source: '7' } }));
  await env.api.initialize(() => {}, user);
  for (const [name, positive, negative] of [['ceil', 4, -3], ['floor', 3, -4]]) {
    assert.equal(env.api.previewFormula('test', [name, '(', { field: 'source' }, '/', '2', ')']), positive);
    assert.equal(env.api.previewFormula('test', [name, '(', '-', '7', '/', '2', ')']), negative);
    assert.equal(env.api.previewFormula('test', [name, '(', '4', ')']), 4);
    for (const tokens of [
      [name, '(', ')'], [name, '(', '1', ',', '2', ')'],
      [name, '1'], [name, '(', '1'], [name, '(', '1', '/', '0', ')'],
    ]) assert.throws(() => env.api.previewFormula('test', tokens));
  }
  assert.equal(env.api.previewFormula('test', ['max', '(', 'ceil', '(', '3.2', ')', ',', 'floor', '(', '5.8', ')', ')', '+', '1']), 6);
  assert.equal(env.api.previewFormula('test', ['ceil', '(', 'floor', '(', '5.8', ')', '/', '2', ')']), 3);
});

test('restores formulas and treats non-numeric inputs as zero in previews and calculations', async () => {
  const env = app(null, () => ({ schemaVersion: 1, revision: 1, data: {
    playerName: 'Ada', source: '4', target: 'stale', formulas: { target: [{ field: 'source' }, '*', '2'] }
  } }));
  await env.api.initialize(() => {}, user);
  const source = new env.Input('source'), target = new env.Input('target');
  env.api.register(target); env.api.register(source);
  assert.equal(target.value, '8');
  assert.equal(target.readOnly, true);
  for (const value of ['', '   ', 'text', '12abc', 'NaN', 'Infinity']) {
    source.value = value; source.edit();
    assert.equal(target.value, '0');
    assert.equal(env.api.previewFormula('preview', [{ field: 'source' }, '+', '3']), 3);
    assert.equal(source.value, value);
  }
  assert.equal(env.api.previewFormula('preview', [{ field: 'missing' }, '+', '3']), 3);
  source.value = '5'; source.edit();
  assert.equal(target.value, '10');
});

test('checkboxes drop old formulas, remain manual, and reject new formulas', async () => {
  let payload;
  const env = app(null, (_, options) => {
    if (options.method === 'PUT') { payload = JSON.parse(options.body); return { revision: 2 }; }
    return { schemaVersion: 1, revision: 1, data: {
      playerName: 'Ada', inspiration: true, formulas: { inspiration: ['0'] }
    } };
  });
  await env.api.initialize(() => {}, user);
  const checkbox = new env.Input('inspiration'); checkbox.type = 'checkbox';
  env.api.register(checkbox);
  await Promise.resolve();
  assert.equal(checkbox.checked, true);
  assert.equal(checkbox.readOnly, false);
  assert.throws(() => env.api.setFormula('inspiration', ['1']), /Checkboxes do not support/);
  checkbox.checked = false; checkbox.edit();
  await env.api.save();
  assert.equal(payload.data.inspiration, false);
  assert.equal(payload.data.formulas.inspiration, undefined);
});

test('attacks and spellcasting fields drop saved formulas and remain editable', async () => {
  let payload;
  const names = ['atkSpellName1', 'atkSpellBonus1', 'atkSpellDmg1', 'atkSpellNotes'];
  const env = app(null, (_, options) => {
    if (options.method === 'PUT') { payload = JSON.parse(options.body); return { revision: 2 }; }
    return { schemaVersion: 1, revision: 1, data: {
      playerName: 'Ada',
      ...Object.fromEntries(names.map(name => [name, '5'])),
      formulas: Object.fromEntries(names.map(name => [name, ['2']]))
    } };
  });
  await env.api.initialize(() => {}, user);
  for (const name of names) {
    const input = new env.Input(name);
    env.api.register(input);
    assert.equal(input.readOnly, false);
    assert.throws(() => env.api.setFormula(name, ['3']), /do not support formulas/);
    input.value = 'Manual'; input.edit();
  }
  await Promise.resolve();
  await env.api.save();
  for (const name of names) {
    assert.equal(payload.data[name], 'Manual');
    assert.equal(payload.data.formulas[name], undefined);
  }
});

test('new sheets persist all default formulas and skills recalculate with proficiency', async () => {
  let payload;
  const env = app(null, (_, options) => {
    if (options.method === 'PUT') { payload = JSON.parse(options.body); return { revision: 2 }; }
    return { schemaVersion: 1, revision: 1, data: {} };
  });
  await env.api.initialize(() => {}, user);
  const score = new env.Input('dexterity-score');
  const modifier = new env.Input('dexterity-modifier');
  const bonus = new env.Input('proficiencyBonus');
  const skill = new env.Input('acrobatics-score');
  const proficient = new env.Input('acrobatics-proficiency'); proficient.type = 'checkbox';
  [modifier, skill, score, bonus, proficient].forEach(input => env.api.register(input));
  for (const value of ['0', '8', '10']) {
    score.value = value; score.edit();
    assert.equal(modifier.value, '0');
    assert.equal(skill.value, '0');
  }
  score.value = '15'; score.edit();
  bonus.value = '2'; bonus.edit();
  assert.equal(modifier.value, '2');
  assert.equal(skill.value, '2');
  proficient.checked = true; proficient.edit();
  assert.equal(skill.value, '4');
  proficient.checked = false; proficient.edit();
  assert.equal(skill.value, '2');
  await env.api.save();
  assert.equal(Object.keys(payload.data.formulas).length, 24);
  assert.deepEqual(payload.data.formulas['survival-score'].at(-1), { field: 'wisdom-modifier' });
});

test('untouched saving throw and skill proficiencies resolve to zero and checked values to one', async () => {
  const env = app(null, () => ({ schemaVersion: 1, revision: 1, data: { playerName: 'Ada' } }));
  await env.api.initialize(() => {}, user);
  for (const name of ['strength-proficiency', 'animal-handling-proficiency']) {
    assert.equal(env.api.previewFormula('test', [{ field: name }]), 0);
    const checkbox = new env.Input(name); checkbox.type = 'checkbox'; env.api.register(checkbox);
    checkbox.checked = true; checkbox.edit();
    assert.equal(env.api.previewFormula('test', [{ field: name }]), 1);
    checkbox.checked = false; checkbox.edit();
    assert.equal(env.api.previewFormula('test', [{ field: name }]), 0);
  }
});

test('existing sheets keep manual scores and custom formulas', async () => {
  const env = app(null, () => ({ schemaVersion: 1, revision: 1, data: {
    'strength-modifier': '7', formulas: { 'acrobatics-score': ['9'] }
  } }));
  await env.api.initialize(() => {}, user);
  const modifier = new env.Input('strength-modifier'), skill = new env.Input('acrobatics-score');
  env.api.register(modifier); env.api.register(skill);
  assert.equal(modifier.value, '7');
  assert.equal(modifier.readOnly, false);
  assert.equal(skill.value, '9');
});


test('creates an empty collection with POST, then updates the returned sheet ID', async () => {
  const calls = [];
  const env = app(null, (path, options) => {
    calls.push([path, options.method]);
    if (!options.method) return { sheets: [] };
    const payload = JSON.parse(options.body);
    if (options.method === 'POST') {
      assert.equal(path, '/api/dnd/v1');
      assert.equal(payload.revision, 0);
      assert.equal(payload.schemaVersion, 1);
      assert.equal(payload.data.playerName, 'Ada Lovelace');
      return { sheetId: 'created/id', revision: 1 };
    }
    assert.equal(path, '/api/dnd/v1/created%2Fid');
    assert.equal(payload.revision, 1);
    return { sheetId: 'created/id', revision: 2 };
  });
  await env.api.initialize(() => {}, user);
  await env.api.save();
  const input = new env.Input('playerName'); env.api.register(input);
  input.value = 'Changed'; input.edit();
  await env.api.save();
  assert.deepEqual(calls.map(call => call[1]), [undefined, 'POST', 'PUT']);
  assert.equal(JSON.parse(env.entries.get('dnd-character:v1:7')).sheetId, 'created/id');
});

test('loads the cached sheet from a collection and keeps recovery data with that sheet', async () => {
  const env = app({ schemaVersion: 1, sheetId: 'second', revision: 2,
    data: { playerName: 'Recovered' }, lastEditedAt: 200, lastSavedAt: 100 }, (path, options) => {
    if (!options.method) return { sheets: [
      { sheetId: 'first', schemaVersion: 1, revision: 1, data: { playerName: 'First' } },
      { sheetId: 'second', schemaVersion: 1, revision: 3, data: { playerName: 'Second' } }
    ] };
    assert.equal(path, '/api/dnd/v1/second');
    assert.equal(JSON.parse(options.body).revision, 3);
    assert.equal(JSON.parse(options.body).data.playerName, 'Recovered');
    return { sheetId: 'second', revision: 4 };
  });
  await env.api.initialize(() => {}, user);
  await env.api.save();
});

test('does not apply a deleted sheet recovery copy to another sheet', async () => {
  const env = app({ schemaVersion: 1, sheetId: 'deleted', revision: 2,
    data: { playerName: 'Deleted' }, lastEditedAt: 200, lastSavedAt: 100 }, () => ({ sheets: [
      { sheetId: 'remaining', schemaVersion: 1, revision: 1, data: { playerName: 'Remaining' } }
    ] }));
  await env.api.initialize(() => {}, user);
  const input = new env.Input('playerName'); env.api.register(input);
  assert.equal(input.value, 'Remaining');
});


test('hash-selected sheets load their individual endpoint and isolate recovery storage', async () => {
  const env = app(null, (path, options) => {
    assert.equal(path, '/api/dnd/v1/chosen%2Fid');
    if (!options.method) return { sheetId: 'chosen/id', schemaVersion: 1, revision: 7, data: { playerName: 'Chosen' } };
    assert.equal(options.method, 'PUT');
    assert.equal(JSON.parse(options.body).revision, 7);
    return { sheetId: 'chosen/id', revision: 8 };
  });
  await env.api.initialize(() => {}, user, 'chosen/id');
  const input = new env.Input('playerName'); env.api.register(input);
  assert.equal(input.value, 'Chosen');
  input.value = 'Edited'; input.edit();
  await env.api.save();
  assert.equal(JSON.parse(env.entries.get('dnd-character:v1:7:chosen%2Fid')).revision, 8);
  assert.equal(env.entries.has('dnd-character:v1:7'), false);
});

test('selection lists sheets and creates characters with valid defaults', async () => {
  const env = app(null, (path, options) => {
    assert.equal(path, '/api/dnd/v1');
    if (!options.method) return { sheets: [{ sheetId: 'existing', data: { 'character-name': 'Hero' } }] };
    assert.equal(options.method, 'POST');
    const payload = JSON.parse(options.body);
    assert.equal(payload.revision, 0);
    assert.equal(payload.data.playerName, 'Ada Lovelace');
    assert.equal(Object.keys(payload.data.formulas).length, 24);
    return { sheetId: 'new', revision: 1 };
  });
  assert.equal((await env.api.listSheets())[0].sheetId, 'existing');
  assert.equal((await env.api.createSheet(user)).sheetId, 'new');
});


test('deletes the selected sheet and removes only its recovery copies', async () => {
  const env = app({ sheetId: 'hero/id' }, (path, options) => {
    assert.equal(path, '/api/dnd/v1/hero%2Fid');
    assert.equal(options.method, 'DELETE');
    assert.equal(options.headers['X-Site-Action'], '1');
    return {};
  });
  env.entries.set('dnd-character:v1:7:hero%2Fid', '{}');
  env.entries.set('dnd-character:v1:7:other', '{}');
  await env.api.deleteSheet('hero/id', user);
  assert.equal(env.entries.has('dnd-character:v1:7:hero%2Fid'), false);
  assert.equal(env.entries.has('dnd-character:v1:7'), false);
  assert.equal(env.entries.has('dnd-character:v1:7:other'), true);
});

test('failed deletion retains the recovery copy', async () => {
  const env = app(null, () => { throw new Error('offline'); });
  env.entries.set('dnd-character:v1:7:hero', '{}');
  await assert.rejects(env.api.deleteSheet('hero', user), /offline/);
  assert.equal(env.entries.has('dnd-character:v1:7:hero'), true);
});

test('selection lists reuse session cache and track creates, edits, and deletes', async () => {
  let reads = 0;
  const env = app(null, (path, options) => {
    if (options.method === 'DELETE') return {};
    if (options.method === 'POST') return { sheetId: 'new', schemaVersion: 1, revision: 1, data: { playerName: 'Ada' } };
    if (options.method === 'PUT') return { sheetId: 'hero', revision: 2 };
    const hero = { sheetId: 'hero', schemaVersion: 1, revision: 1, data: { playerName: 'Ada', 'character-name': 'Hero' } };
    if (path === '/api/dnd/v1/hero') return hero;
    reads++;
    return { sheets: [hero] };
  }, true);
  await env.api.listSheets(user);
  await env.api.listSheets(user);
  assert.equal(reads, 1);
  await env.api.initialize(() => {}, user, 'hero');
  const input = new env.Input('character-name');
  env.api.register(input);
  input.value = 'Renamed'; input.edit();
  await env.api.save();
  assert.equal((await env.api.listSheets(user))[0].data['character-name'], 'Renamed');
  await env.api.createSheet(user);
  assert.equal((await env.api.listSheets(user)).length, 2);
  await env.api.deleteSheet('hero', user);
  assert.equal((await env.api.listSheets(user))[0].sheetId, 'new');
  assert.equal(reads, 1);
  await env.api.listSheets({ id: 8 });
  assert.equal(reads, 2);
});

test('legacy class and level split and level supports saved formulas', async () => {
  const writes = [];
  const env = app(null, (_, options) => {
    if (options.method) {
      writes.push(JSON.parse(options.body));
      return { revision: 2 };
    }
    return { schemaVersion: 1, revision: 1, data: { classAndLevel: 'Wizard 5', playerName: 'Ada' } };
  });
  await env.api.initialize(() => {}, user);
  const characterClass = new env.Input('class');
  const level = new env.Input('level');
  env.api.register(characterClass);
  env.api.register(level);
  assert.equal(characterClass.value, 'Wizard');
  assert.equal(level.value, '5');
  env.api.setFormula('level', ['2', '+', '4']);
  assert.equal(level.value, '6');
  assert.equal(level.readOnly, true);
  await env.api.save();
  assert.equal(writes[0].data.class, 'Wizard');
  assert.equal(writes[0].data.level, '6');
  assert.deepEqual(writes[0].data.formulas.level, ['2', '+', '4']);
});

test('reopening a sheet uses session data and the latest saved revision without another read', async () => {
  const reads = [];
  const writes = [];
  const env = app(null, (path, options) => {
    if (options.method === 'PUT') {
      writes.push(JSON.parse(options.body));
      return { sheetId: 'hero', revision: writes.length + 1 };
    }
    reads.push(path);
    return { sheetId: path.split('/').at(-1), schemaVersion: 1, revision: 1,
      data: { playerName: 'Ada', 'character-name': path.split('/').at(-1) } };
  }, true);
  await env.api.initialize(() => {}, user, 'hero');
  const name = new env.Input('character-name'); env.api.register(name);
  name.value = 'Renamed'; name.edit();
  await env.api.save();
  await env.api.initialize(() => {}, user, 'other');
  await env.api.initialize(() => {}, user, 'hero');
  const reopened = new env.Input('character-name'); env.api.register(reopened);
  assert.equal(reopened.value, 'Renamed');
  assert.deepEqual(reads, ['/api/dnd/v1/hero', '/api/dnd/v1/other']);
  reopened.value = 'Changed again'; reopened.edit();
  await env.api.save();
  assert.equal(writes[1].revision, 2);
  await env.api.initialize(() => {}, { ...user }, 'hero');
  assert.equal(reads.length, 3);
});

test('deleting an opened sheet invalidates its session cache', async () => {
  let reads = 0;
  const env = app(null, (path, options) => {
    if (options.method === 'DELETE') return {};
    reads++;
    return { sheetId: 'hero', schemaVersion: 1, revision: 1, data: { playerName: 'Ada' } };
  }, true);
  await env.api.initialize(() => {}, user, 'hero');
  await env.api.deleteSheet('hero', user);
  await env.api.initialize(() => {}, user, 'hero');
  assert.equal(reads, 2);
});

test('background preloading shares in-flight requests with the first sheet open', async () => {
  const reads = [];
  let finish;
  const env = app(null, (path) => {
    reads.push(path);
    if (path === '/api/dnd/v1') return { sheets: [
      { sheetId: 'hero', data: {} }, { sheetId: 'other', data: {} }
    ] };
    if (path.endsWith('/hero')) return new Promise(resolve => { finish = resolve; });
    return { sheetId: 'other', schemaVersion: 1, revision: 1, data: { playerName: 'Other' } };
  }, true);
  const preloading = env.api.preloadSheets(user);
  await new Promise(setImmediate);
  const opening = env.api.initialize(() => {}, user, 'hero');
  finish({ sheetId: 'hero', schemaVersion: 1, revision: 1, data: { playerName: 'Preloaded' } });
  await Promise.all([preloading, opening]);
  const input = new env.Input('playerName'); env.api.register(input);
  assert.equal(input.value, 'Preloaded');
  assert.deepEqual(reads, ['/api/dnd/v1', '/api/dnd/v1/hero', '/api/dnd/v1/other']);
});

test('failed preloads are retried when opening the sheet', async () => {
  let reads = 0;
  const env = app(null, path => {
    if (path === '/api/dnd/v1') return { sheets: [{ sheetId: 'hero', data: {} }] };
    if (++reads === 1) throw new Error('offline');
    return { sheetId: 'hero', schemaVersion: 1, revision: 1, data: { playerName: 'Ada' } };
  }, true);
  await assert.rejects(env.api.preloadSheets(user), /offline/);
  await env.api.initialize(() => {}, user, 'hero');
  assert.equal(reads, 2);
});
