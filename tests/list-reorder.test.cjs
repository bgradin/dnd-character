const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function list() {
  let entries = ['a', 'b', 'c'].map(id => ({ id, name: id }));
  const context = vm.createContext({ useRef: value => ({ current: value }), useState: value => [value, () => {}] });
  vm.runInContext(fs.readFileSync('src/hooks/useListReorder.js', 'utf8')
    .replace(/^import .*;\n/m, '').replace('export default ', ''), context);
  const reorder = context.useListReorder(() => entries, next => { entries = next; });
  return { reorder, ids: () => Array.from(entries, entry => entry.id) };
}
function start(reorder, id) {
  reorder.handleProps({ id, name: id }).onDragStart({
    dataTransfer: { setData() {}, setDragImage() {} },
    currentTarget: { closest() { return {}; } },
  });
}

test('dragging reorders in both directions and ending a drag clears its source', () => {
  const { reorder, ids } = list();
  start(reorder, 'a');
  reorder.itemProps('c').onDrop({ preventDefault() {} });
  assert.deepEqual(ids(), ['b', 'c', 'a']);
  start(reorder, 'a');
  reorder.itemProps('b').onDrop({ preventDefault() {} });
  assert.deepEqual(ids(), ['a', 'b', 'c']);
  start(reorder, 'a');
  reorder.handleProps({ id: 'a' }).onDragEnd();
  reorder.itemProps('c').onDrop({ preventDefault() { assert.fail('Cancelled drag accepted'); } });
  assert.deepEqual(ids(), ['a', 'b', 'c']);
});

test('keyboard reordering respects boundaries and lists reject drags from another list', () => {
  const first = list(), second = list();
  const handle = first.reorder.handleProps({ id: 'a', name: 'a' });
  handle.onKeyDown({ key: 'ArrowUp', preventDefault() {} });
  assert.deepEqual(first.ids(), ['a', 'b', 'c']);
  handle.onKeyDown({ key: 'ArrowDown', preventDefault() {} });
  assert.deepEqual(first.ids(), ['b', 'a', 'c']);
  start(first.reorder, 'a');
  second.reorder.itemProps('c').onDrop({ preventDefault() { assert.fail('Foreign drag accepted'); } });
  assert.deepEqual(second.ids(), ['a', 'b', 'c']);
});
