const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { generateManifest } = require('../scripts/generate-data-manifest.cjs');

test('manifest indexes nested files and tracks additions, changes, and removals', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'data-manifest-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'nested'));
  fs.writeFileSync(path.join(directory, 'nested/a.json'), 'abc');
  const initial = generateManifest(directory);
  assert.deepEqual(initial, { schemaVersion: 1, files: { 'nested/a.json': {
    sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', size: 3,
  } } });
  const serialized = fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8');
  generateManifest(directory);
  assert.equal(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'), serialized);
  fs.writeFileSync(path.join(directory, 'nested/a.json'), 'changed');
  fs.writeFileSync(path.join(directory, 'new.json'), '{}');
  const changed = generateManifest(directory);
  assert.notEqual(changed.files['nested/a.json'].sha256, initial.files['nested/a.json'].sha256);
  assert.equal(changed.files['new.json'].size, 2);
  fs.unlinkSync(path.join(directory, 'nested/a.json'));
  assert.deepEqual(Object.keys(generateManifest(directory).files), ['new.json']);
});

test('manifest supports an initially missing data directory', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'data-manifest-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(generateManifest(path.join(root, 'data')), { schemaVersion: 1, files: {} });
});
